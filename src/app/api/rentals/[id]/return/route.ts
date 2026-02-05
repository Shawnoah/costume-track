import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and get rental with items
    const rental = await db.rental.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        status: "ACTIVE",
      },
      include: {
        items: true,
      },
    });

    if (!rental) {
      return NextResponse.json({ message: "Rental not found or already returned" }, { status: 404 });
    }

    // Update rental and items in a transaction
    await db.$transaction(async (tx) => {
      // Mark rental as returned
      await tx.rental.update({
        where: { id },
        data: {
          status: "RETURNED",
          returnDate: new Date(),
        },
      });

      // Update all rental items with return condition (same as checkout for now)
      for (const item of rental.items) {
        await tx.rentalItem.update({
          where: { id: item.id },
          data: { conditionIn: item.conditionOut },
        });
      }

      // Update costume statuses back to AVAILABLE
      await tx.costumeItem.updateMany({
        where: {
          id: { in: rental.items.map((i) => i.costumeItemId) },
        },
        data: { status: "AVAILABLE" },
      });
    });

    return NextResponse.json({ message: "Rental returned successfully" });
  } catch (error) {
    console.error("Return rental error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
