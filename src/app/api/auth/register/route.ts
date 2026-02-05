import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Generate unique slug for organization
    let slug = slugify(validatedData.organizationName);
    let slugExists = await db.organization.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${slugify(validatedData.organizationName)}-${counter}`;
      slugExists = await db.organization.findUnique({ where: { slug } });
      counter++;
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 12);

    // Create organization and user in a transaction
    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          passwordHash,
          role: "OWNER",
          organizationId: organization.id,
        },
      });

      // Create default categories
      await tx.category.createMany({
        data: [
          { name: "Dresses", organizationId: organization.id, color: "#9333ea" },
          { name: "Suits", organizationId: organization.id, color: "#22c55e" },
          { name: "Accessories", organizationId: organization.id, color: "#eab308" },
          { name: "Footwear", organizationId: organization.id, color: "#3b82f6" },
          { name: "Headwear", organizationId: organization.id, color: "#ec4899" },
          { name: "Outerwear", organizationId: organization.id, color: "#f97316" },
        ],
      });

      return { organization, user };
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: result.user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
