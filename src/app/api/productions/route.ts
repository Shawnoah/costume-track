import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const productionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  venue: z.string().nullable().optional(),
  director: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = productionSchema.parse(body);

    const production = await db.production.create({
      data: {
        name: data.name,
        venue: data.venue,
        director: data.director,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(production, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Create production error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const productions = await db.production.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        rentals: {
          where: { status: "ACTIVE" },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(productions);
  } catch (error) {
    console.error("Get productions error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
