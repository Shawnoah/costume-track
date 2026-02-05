import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const sceneSchema = z.object({
  name: z.string().min(1, "Scene name is required"),
  act: z.number().int().nullable().optional(),
  scene: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
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

    const scenes = await db.productionScene.findMany({
      where: { productionId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(scenes);
  } catch (error) {
    console.error("Get scenes error:", error);
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

    const body = await req.json();
    const data = sceneSchema.parse(body);

    // Get max sortOrder for new scene
    const maxOrder = await db.productionScene.aggregate({
      where: { productionId },
      _max: { sortOrder: true },
    });

    const scene = await db.productionScene.create({
      data: {
        name: data.name,
        act: data.act,
        scene: data.scene,
        description: data.description,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        productionId,
      },
    });

    return NextResponse.json(scene, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error("Create scene error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
