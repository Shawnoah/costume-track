import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sku = searchParams.get("sku");

    if (!sku) {
      return NextResponse.json({ message: "SKU is required" }, { status: 400 });
    }

    // Look up by SKU (case-insensitive)
    const costume = await db.costumeItem.findFirst({
      where: {
        organizationId: session.user.organizationId,
        sku: { equals: sku, mode: "insensitive" },
      },
      include: {
        category: { select: { name: true } },
        photos: {
          where: { type: "MAIN" },
          take: 1,
          select: { url: true },
        },
      },
    });

    if (!costume) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: costume.id,
      name: costume.name,
      sku: costume.sku,
      status: costume.status,
      location: costume.location,
      category: costume.category,
      photos: costume.photos,
    });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
