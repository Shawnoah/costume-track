import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateCharacterSchema = z.object({
  name: z.string().min(1, "Character name is required").optional(),
  actorName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  // Actor measurements
  height: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  head: z.string().nullable().optional(),
  collar: z.string().nullable().optional(),
  chest: z.string().nullable().optional(),
  bust: z.string().nullable().optional(),
  underBust: z.string().nullable().optional(),
  waist: z.string().nullable().optional(),
  hip: z.string().nullable().optional(),
  inseam: z.string().nullable().optional(),
  outseam: z.string().nullable().optional(),
  sleeve: z.string().nullable().optional(),
  shoeSize: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: productionId, characterId } = await params;

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

    const body = await req.json();
    const data = updateCharacterSchema.parse(body);

    const character = await db.productionCharacter.update({
      where: { id: characterId },
      data: {
        name: data.name,
        actorName: data.actorName,
        description: data.description,
        color: data.color,
        sortOrder: data.sortOrder,
        // Actor measurements
        height: data.height,
        weight: data.weight,
        head: data.head,
        collar: data.collar,
        chest: data.chest,
        bust: data.bust,
        underBust: data.underBust,
        waist: data.waist,
        hip: data.hip,
        inseam: data.inseam,
        outseam: data.outseam,
        sleeve: data.sleeve,
        shoeSize: data.shoeSize,
      },
    });

    return NextResponse.json(character);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error("Update character error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: productionId, characterId } = await params;

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

    await db.productionCharacter.delete({
      where: { id: characterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete character error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
