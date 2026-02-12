import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { isAdminRole } from "@/lib/utils";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const portalSchema = z.object({
  enabled: z.boolean().optional(),
  regenerateToken: z.boolean().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only owners and admins can manage portal access
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await safeJsonParse(req);
    if (!body) return badRequestResponse();
    const data = portalSchema.parse(body);

    // Verify ownership
    const existing = await db.customer.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // Build update data
    const updateData: { portalEnabled?: boolean; portalToken?: string } = {};

    if (data.enabled !== undefined) {
      updateData.portalEnabled = data.enabled;
      // Generate a new token if enabling and no token exists
      if (data.enabled && !existing.portalToken) {
        updateData.portalToken = generateToken();
      }
    }

    if (data.regenerateToken) {
      updateData.portalToken = generateToken();
    }

    const customer = await db.customer.update({
      where: { id },
      data: updateData,
      select: {
        portalEnabled: true,
        portalToken: true,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Portal update error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

function generateToken(): string {
  return randomBytes(24).toString("hex");
}
