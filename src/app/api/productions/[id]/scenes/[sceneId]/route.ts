import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const updateSceneSchema = z.object({
  name: z.string().min(1, "Scene name is required").optional(),
  act: z.number().int().nullable().optional(),
  scene: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: productionId, sceneId } = await params;

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
    const data = updateSceneSchema.parse(body);

    const scene = await db.productionScene.update({
      where: { id: sceneId },
      data: {
        name: data.name,
        act: data.act,
        scene: data.scene,
        description: data.description,
        sortOrder: data.sortOrder,
      },
    });

    return NextResponse.json(scene);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error("Update scene error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: productionId, sceneId } = await params;

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

    await db.productionScene.delete({
      where: { id: sceneId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete scene error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
