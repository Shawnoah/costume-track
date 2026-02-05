import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const rentalSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  productionId: z.string().nullable().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  depositAmount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(
    z.object({
      costumeItemId: z.string(),
      conditionOut: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_REPAIR"]),
    })
  ).min(1, "At least one item is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, id: userId } = session.user;

    const body = await req.json();
    const data = rentalSchema.parse(body);

    // Create rental and update item statuses in a transaction
    const rental = await db.$transaction(async (tx) => {
      // Create the rental
      const newRental = await tx.rental.create({
        data: {
          organizationId,
          customerId: data.customerId,
          productionId: data.productionId || null,
          dueDate: new Date(data.dueDate),
          depositAmount: data.depositAmount,
          notes: data.notes,
          createdById: userId,
          items: {
            create: data.items.map((item) => ({
              costumeItemId: item.costumeItemId,
              conditionOut: item.conditionOut,
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { costumeItem: true } },
        },
      });

      // Update costume statuses to RENTED
      await tx.costumeItem.updateMany({
        where: {
          id: { in: data.items.map((i) => i.costumeItemId) },
        },
        data: { status: "RENTED" },
      });

      return newRental;
    });

    return NextResponse.json(rental, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Create rental error:", error);
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

    const { organizationId } = session.user;

    const rentals = await db.rental.findMany({
      where: { organizationId },
      include: {
        customer: true,
        production: true,
        items: { include: { costumeItem: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rentals);
  } catch (error) {
    console.error("Get rentals error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
