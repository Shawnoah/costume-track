import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const onboardingSchema = z.object({
  organizationName: z.string().min(2).max(100),
});

// Generate a URL-friendly slug from organization name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// Ensure slug is unique by appending a number if needed
async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await db.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an organization
    const existingUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (existingUser.organizationId) {
      return NextResponse.json(
        { message: "You already belong to an organization" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { organizationName } = onboardingSchema.parse(body);

    // Generate unique slug
    const baseSlug = generateSlug(organizationName);
    const slug = await getUniqueSlug(baseSlug);

    // Create organization and update user in a transaction
    const organization = await db.$transaction(async (tx) => {
      // Create the organization
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
        },
      });

      // Update the user to belong to this organization as OWNER
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          organizationId: org.id,
          role: "OWNER",
        },
      });

      return org;
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Onboarding error:", error);
    return NextResponse.json(
      { message: "Failed to create organization" },
      { status: 500 }
    );
  }
}
