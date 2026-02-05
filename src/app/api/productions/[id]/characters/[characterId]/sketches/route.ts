import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSketchSchema = z.object({
  url: z.string().url("Invalid URL"),
  key: z.string().min(1, "Storage key is required"),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sceneId: z.string().nullable().optional(),
});

export async function GET(
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

    const sketches = await db.characterSketch.findMany({
      where: { characterId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(sketches);
  } catch (error) {
    console.error("Get sketches error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
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

    // Verify character exists
    const character = await db.productionCharacter.findFirst({
      where: { id: characterId, productionId },
    });

    if (!character) {
      return NextResponse.json({ message: "Character not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = createSketchSchema.parse(body);

    // Get the next sort order
    const lastSketch = await db.characterSketch.findFirst({
      where: { characterId },
      orderBy: { sortOrder: "desc" },
    });

    const sketch = await db.characterSketch.create({
      data: {
        url: data.url,
        key: data.key,
        name: data.name || null,
        description: data.description || null,
        sceneId: data.sceneId || null,
        characterId,
        sortOrder: (lastSketch?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(sketch, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error("Create sketch error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
