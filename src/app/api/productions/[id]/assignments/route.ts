import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const assignmentSchema = z.object({
  characterId: z.string().min(1, "Character is required"),
  sceneId: z.string().min(1, "Scene is required"),
  costumeItemId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isQuickChange: z.boolean().optional(),
  changeTimeSeconds: z.number().int().nullable().optional(),
});

const updateAssignmentSchema = z.object({
  costumeItemId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isQuickChange: z.boolean().optional(),
  changeTimeSeconds: z.number().int().nullable().optional(),
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

    const { id: productionId } = await params;

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

    // Get all assignments with related data
    const assignments = await db.costumeAssignment.findMany({
      where: {
        character: { productionId },
      },
      include: {
        character: true,
        scene: true,
        costumeItem: {
          include: {
            photos: {
              where: { type: "MAIN" },
              take: 1,
            },
          },
        },
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: productionId } = await params;

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

    const body = await safeJsonParse(req);
    if (!body) return badRequestResponse();
    const data = assignmentSchema.parse(body);

    // Verify character and scene belong to this production
    const [character, scene] = await Promise.all([
      db.productionCharacter.findFirst({
        where: { id: data.characterId, productionId },
      }),
      db.productionScene.findFirst({
        where: { id: data.sceneId, productionId },
      }),
    ]);

    if (!character) {
      return NextResponse.json({ message: "Character not found" }, { status: 404 });
    }
    if (!scene) {
      return NextResponse.json({ message: "Scene not found" }, { status: 404 });
    }

    // If costume item provided, verify it belongs to organization
    if (data.costumeItemId) {
      const costumeItem = await db.costumeItem.findFirst({
        where: {
          id: data.costumeItemId,
          organizationId: session.user.organizationId,
        },
      });
      if (!costumeItem) {
        return NextResponse.json({ message: "Costume item not found" }, { status: 404 });
      }
    }

    // Upsert assignment (create or update)
    const assignment = await db.costumeAssignment.upsert({
      where: {
        characterId_sceneId: {
          characterId: data.characterId,
          sceneId: data.sceneId,
        },
      },
      update: {
        costumeItemId: data.costumeItemId,
        notes: data.notes,
        isQuickChange: data.isQuickChange ?? false,
        changeTimeSeconds: data.changeTimeSeconds,
      },
      create: {
        characterId: data.characterId,
        sceneId: data.sceneId,
        costumeItemId: data.costumeItemId,
        notes: data.notes,
        isQuickChange: data.isQuickChange ?? false,
        changeTimeSeconds: data.changeTimeSeconds,
      },
      include: {
        character: true,
        scene: true,
        costumeItem: {
          include: {
            photos: {
              where: { type: "MAIN" },
              take: 1,
            },
          },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error("Create assignment error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
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

    const { id: productionId } = await params;
    const url = new URL(req.url);
    const characterId = url.searchParams.get("characterId");
    const sceneId = url.searchParams.get("sceneId");

    if (!characterId || !sceneId) {
      return NextResponse.json(
        { message: "characterId and sceneId are required" },
        { status: 400 }
      );
    }

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

    await db.costumeAssignment.delete({
      where: {
        characterId_sceneId: {
          characterId,
          sceneId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
