import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().nullable().optional(),
  publicPageEnabled: z.boolean().optional(),
});

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only owners and admins can update profile
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await safeJsonParse(req);
    if (!body) return badRequestResponse();
    const data = profileSchema.parse(body);

    await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name: data.name,
        description: data.description || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        address: data.address || null,
        website: data.website || null,
        logoUrl: data.logoUrl,
        publicPageEnabled: data.publicPageEnabled,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
