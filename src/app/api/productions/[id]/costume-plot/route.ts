import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

    // Get production with all costume plot data
    const production = await db.production.findFirst({
      where: {
        id: productionId,
        organizationId: session.user.organizationId,
      },
      include: {
        characters: {
          orderBy: { sortOrder: "asc" },
        },
        scenes: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!production) {
      return NextResponse.json({ message: "Production not found" }, { status: 404 });
    }

    // Get all assignments for this production
    const assignments = await db.costumeAssignment.findMany({
      where: {
        character: { productionId },
      },
      include: {
        costumeItem: {
          include: {
            category: true,
            photos: {
              where: { type: "MAIN" },
              take: 1,
            },
          },
        },
      },
    });

    // Detect quick changes (same character appearing in consecutive scenes)
    const quickChanges: Array<{
      characterId: string;
      fromSceneId: string;
      toSceneId: string;
      fromAssignment: typeof assignments[0] | undefined;
      toAssignment: typeof assignments[0] | undefined;
    }> = [];

    for (const character of production.characters) {
      for (let i = 0; i < production.scenes.length - 1; i++) {
        const currentScene = production.scenes[i];
        const nextScene = production.scenes[i + 1];

        const currentAssignment = assignments.find(
          (a) => a.characterId === character.id && a.sceneId === currentScene.id
        );
        const nextAssignment = assignments.find(
          (a) => a.characterId === character.id && a.sceneId === nextScene.id
        );

        // If character has costume in both consecutive scenes and they're different
        if (
          currentAssignment?.costumeItemId &&
          nextAssignment?.costumeItemId &&
          currentAssignment.costumeItemId !== nextAssignment.costumeItemId
        ) {
          quickChanges.push({
            characterId: character.id,
            fromSceneId: currentScene.id,
            toSceneId: nextScene.id,
            fromAssignment: currentAssignment,
            toAssignment: nextAssignment,
          });
        }
      }
    }

    // Build assignment matrix (characterId -> sceneId -> assignment)
    const assignmentMatrix: Record<string, Record<string, typeof assignments[0]>> = {};
    for (const assignment of assignments) {
      if (!assignmentMatrix[assignment.characterId]) {
        assignmentMatrix[assignment.characterId] = {};
      }
      assignmentMatrix[assignment.characterId][assignment.sceneId] = assignment;
    }

    return NextResponse.json({
      production: {
        id: production.id,
        name: production.name,
        venue: production.venue,
        director: production.director,
        startDate: production.startDate,
        endDate: production.endDate,
      },
      characters: production.characters,
      scenes: production.scenes,
      assignments: assignmentMatrix,
      quickChanges,
      stats: {
        totalCharacters: production.characters.length,
        totalScenes: production.scenes.length,
        totalAssignments: assignments.length,
        assignmentsWithCostumes: assignments.filter((a) => a.costumeItemId).length,
        quickChangeCount: quickChanges.length,
      },
    });
  } catch (error) {
    console.error("Get costume plot error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
