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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = costumeSchema.parse(body);

    const costume = await db.costumeItem.create({
      data: {
        ...data,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(costume, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Create costume error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const costumes = await db.costumeItem.findMany({
      where: { organizationId: session.user.organizationId },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(costumes);
  } catch (error) {
    console.error("Get costumes error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
