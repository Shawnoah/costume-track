import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const costumeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  era: z.string().nullable().optional(),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_REPAIR"]),
  status: z.enum(["AVAILABLE", "RENTED", "RESERVED", "MAINTENANCE", "RETIRED"]),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  rentalPrice: z.number().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const costume = await db.costumeItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: { category: true },
    });

    if (!costume) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(costume);
  } catch (error) {
    console.error("Get costume error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = costumeSchema.parse(body);

    // Verify ownership
    const existing = await db.costumeItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const costume = await db.costumeItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(costume);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Update costume error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.costumeItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await db.costumeItem.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete costume error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
