import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/pagination";

const photoSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  key: z.string(),
  type: z.enum(["MAIN", "ALTERNATE", "FEATURE", "MATERIAL", "INFO"]),
  description: z.string().nullable().optional(),
  sortOrder: z.number(),
});

const costumeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  era: z.string().nullable().optional(),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_REPAIR"]),
  status: z.enum(["AVAILABLE", "RENTED", "RESERVED", "MAINTENANCE", "RETIRED"]),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  rentalPrice: z.number().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  photos: z.array(photoSchema).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { photos, ...data } = costumeSchema.parse(body);

    const costume = await db.costumeItem.create({
      data: {
        ...data,
        organizationId: session.user.organizationId,
        photos: photos && photos.length > 0 ? {
          create: photos.map((p) => ({
            url: p.url,
            key: p.key,
            type: p.type,
            description: p.description,
            sortOrder: p.sortOrder,
          })),
        } : undefined,
      },
      include: { photos: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
    });

    return NextResponse.json(costume, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Create costume error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const pagination = parsePaginationParams(url);

    // Parse filter params
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const categoryId = url.searchParams.get("categoryId") || "";

    const where = {
      organizationId: session.user.organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status: status as "AVAILABLE" | "RENTED" | "RESERVED" | "MAINTENANCE" | "RETIRED" }),
      ...(categoryId && { categoryId }),
    };

    const [costumes, total] = await Promise.all([
      db.costumeItem.findMany({
        where,
        include: {
          category: true,
          photos: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] },
        },
        orderBy: { updatedAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      db.costumeItem.count({ where }),
    ]);

    return NextResponse.json(createPaginatedResponse(costumes, total, pagination));
  } catch (error) {
    console.error("Get costumes error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
