import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { isAdminRole } from "@/lib/utils";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const costume = await db.costumeItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        category: true,
        photos: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] },
      },
    });

    if (!costume) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(costume);
  } catch (error) {
    console.error("Get costume error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { photos, ...data } = costumeSchema.parse(body);

    // Verify ownership
    const existing = await db.costumeItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: { photos: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // Handle photos: delete removed, update existing, create new
    const existingPhotoIds = existing.photos.map((p) => p.id);
    const newPhotoIds = photos?.filter((p) => p.id).map((p) => p.id!) || [];
    const photosToDelete = existingPhotoIds.filter((id) => !newPhotoIds.includes(id));

    // Use transaction to update costume and photos
    const costume = await db.$transaction(async (tx) => {
      // Delete removed photos
      if (photosToDelete.length > 0) {
        await tx.costumePhoto.deleteMany({
          where: { id: { in: photosToDelete } },
        });
      }

      // Update or create photos
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          if (photo.id) {
            // Update existing
            await tx.costumePhoto.update({
              where: { id: photo.id },
              data: {
                type: photo.type,
                description: photo.description,
                sortOrder: photo.sortOrder,
              },
            });
          } else {
            // Create new
            await tx.costumePhoto.create({
              data: {
                url: photo.url,
                key: photo.key,
                type: photo.type,
                description: photo.description,
                sortOrder: photo.sortOrder,
                costumeItemId: id,
              },
            });
          }
        }
      }

      // Update costume
      return tx.costumeItem.update({
        where: { id },
        data,
        include: { photos: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] } },
      });
    });

    return NextResponse.json(costume);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Update costume error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
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

    // Only owners and admins can delete costumes
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.costumeItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await db.costumeItem.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete costume error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
