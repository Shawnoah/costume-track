import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const characterSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  actorName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
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

    const characters = await db.productionCharacter.findMany({
      where: { productionId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error("Get characters error:", error);
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
    const data = characterSchema.parse(body);

    // Get max sortOrder for new character
    const maxOrder = await db.productionCharacter.aggregate({
      where: { productionId },
      _max: { sortOrder: true },
    });

    const character = await db.productionCharacter.create({
      data: {
        name: data.name,
        actorName: data.actorName,
        description: data.description,
        color: data.color,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        productionId,
      },
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error("Create character error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
