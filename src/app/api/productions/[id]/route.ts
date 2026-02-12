import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const updateProductionSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  venue: z.string().nullable().optional(),
  director: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const production = await db.production.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        rentals: {
          include: {
            customer: true,
            items: {
              include: { costumeItem: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!production) {
      return NextResponse.json(
        { message: "Production not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(production);
  } catch (error) {
    console.error("Get production error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await safeJsonParse(req);
    if (!body) return badRequestResponse();
    const data = updateProductionSchema.parse(body);

    // Verify production belongs to organization
    const existing = await db.production.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Production not found" },
        { status: 404 }
      );
    }

    const production = await db.production.update({
      where: { id },
      data: {
        name: data.name,
        venue: data.venue,
        director: data.director,
        startDate: data.startDate ? new Date(data.startDate) : data.startDate === null ? null : undefined,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
        notes: data.notes,
      },
    });

    return NextResponse.json(production);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Update production error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify production belongs to organization
    const existing = await db.production.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        rentals: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Production not found" },
        { status: 404 }
      );
    }

    if (existing.rentals.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete production with associated rentals" },
        { status: 400 }
      );
    }

    await db.production.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete production error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
