import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CostumePlot } from "@/components/productions/costume-plot";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CostumePlotPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const { id } = await params;

  // Get production with all costume plot data
  const production = await db.production.findFirst({
    where: {
      id,
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
    notFound();
  }

  // Get all assignments
  const assignments = await db.costumeAssignment.findMany({
    where: {
      character: { productionId: id },
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

  // Get available costumes for assignment
  const availableCostumes = await db.costumeItem.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    include: {
      category: true,
      photos: {
        where: { type: "MAIN" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  // Build assignment matrix
  const assignmentMatrix: Record<string, Record<string, {
    id: string;
    notes: string | null;
    isQuickChange: boolean;
    changeTimeSeconds: number | null;
    costumeItem: {
      id: string;
      name: string;
      category: { name: string; color: string | null } | null;
      photos: { url: string }[];
    } | null;
  }>> = {};

  for (const assignment of assignments) {
    if (!assignmentMatrix[assignment.characterId]) {
      assignmentMatrix[assignment.characterId] = {};
    }
    assignmentMatrix[assignment.characterId][assignment.sceneId] = {
      id: assignment.id,
      notes: assignment.notes,
      isQuickChange: assignment.isQuickChange,
      changeTimeSeconds: assignment.changeTimeSeconds,
      costumeItem: assignment.costumeItem ? {
        id: assignment.costumeItem.id,
        name: assignment.costumeItem.name,
        category: assignment.costumeItem.category,
        photos: assignment.costumeItem.photos,
      } : null,
    };
  }

  return (
    <CostumePlot
      production={{
        id: production.id,
        name: production.name,
      }}
      characters={production.characters.map((c) => ({
        id: c.id,
        name: c.name,
        actorName: c.actorName,
        color: c.color,
        sortOrder: c.sortOrder,
      }))}
      scenes={production.scenes.map((s) => ({
        id: s.id,
        name: s.name,
        act: s.act,
        scene: s.scene,
        description: s.description,
        sortOrder: s.sortOrder,
      }))}
      assignments={assignmentMatrix}
      availableCostumes={availableCostumes.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category ? { name: c.category.name, color: c.category.color } : null,
        photo: c.photos[0]?.url || null,
      }))}
    />
  );
}
