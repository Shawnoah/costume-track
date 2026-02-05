import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; characterId: string; sketchId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: productionId, characterId, sketchId } = await params;

    // Verify production belongs to organization
    const production = await db.production.findFirst({
      where: {
        id: productionId,
        organizationId: session.user.organizationId,
      },
    });

    if (!production) {
      return NextResponse.json({ message: "Production not found" }, { status: 404 });
    }

    // Get the sketch to delete from blob storage
    const sketch = await db.characterSketch.findFirst({
      where: {
        id: sketchId,
        characterId,
      },
    });

    if (!sketch) {
      return NextResponse.json({ message: "Sketch not found" }, { status: 404 });
    }

    // Delete from blob storage (ignore errors)
    try {
      await fetch(`${process.env.NEXTAUTH_URL || ""}/api/upload`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sketch.url }),
      });
    } catch (err) {
      console.error("Failed to delete sketch from storage:", err);
    }

    // Delete from database
    await db.characterSketch.delete({
      where: { id: sketchId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete sketch error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
