import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { LABEL_FORMAT_PRESETS } from "@/lib/label-formats";

// Schema for creating custom label formats
const createFormatSchema = z.object({
  name: z.string().min(1).max(100),
  widthInches: z.number().positive().max(12),
  heightInches: z.number().positive().max(12),
  description: z.string().max(500).optional(),
});

// Ensure preset formats exist in DB
async function ensurePresets() {
  const existingPresets = await db.labelFormat.findMany({
    where: { isPreset: true },
  });

  if (existingPresets.length === 0) {
    // Create all presets
    await db.labelFormat.createMany({
      data: LABEL_FORMAT_PRESETS.map((preset) => ({
        ...preset,
        isPreset: true,
        organizationId: null,
      })),
    });
  }
}

// GET - List all available label formats (presets + org custom)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ensure presets exist
    await ensurePresets();

    // Get presets and org's custom formats
    const formats = await db.labelFormat.findMany({
      where: {
        OR: [
          { isPreset: true },
          { organizationId: session.user.organizationId },
        ],
      },
      orderBy: [{ isPreset: "desc" }, { name: "asc" }],
    });

    // Get org's selected format
    const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { selectedLabelFormatId: true },
    });

    return NextResponse.json({
      formats,
      selectedFormatId: org?.selectedLabelFormatId,
    });
  } catch (error) {
    console.error("Error fetching label formats:", error);
    return NextResponse.json(
      { message: "Failed to fetch label formats" },
      { status: 500 }
    );
  }
}

// POST - Create custom label format
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createFormatSchema.parse(body);

    const format = await db.labelFormat.create({
      data: {
        ...data,
        isPreset: false,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(format);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating label format:", error);
    return NextResponse.json(
      { message: "Failed to create label format" },
      { status: 500 }
    );
  }
}

// PATCH - Select a label format for the organization
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { formatId } = z.object({ formatId: z.string().nullable() }).parse(body);

    // Verify format exists and is accessible
    if (formatId) {
      const format = await db.labelFormat.findFirst({
        where: {
          id: formatId,
          OR: [
            { isPreset: true },
            { organizationId: session.user.organizationId },
          ],
        },
      });

      if (!format) {
        return NextResponse.json(
          { message: "Label format not found" },
          { status: 404 }
        );
      }
    }

    await db.organization.update({
      where: { id: session.user.organizationId },
      data: { selectedLabelFormatId: formatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Error selecting label format:", error);
    return NextResponse.json(
      { message: "Failed to select label format" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a custom label format
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formatId = searchParams.get("id");

    if (!formatId) {
      return NextResponse.json(
        { message: "Format ID required" },
        { status: 400 }
      );
    }

    // Only allow deleting own custom formats (not presets)
    const format = await db.labelFormat.findFirst({
      where: {
        id: formatId,
        organizationId: session.user.organizationId,
        isPreset: false,
      },
    });

    if (!format) {
      return NextResponse.json(
        { message: "Custom label format not found" },
        { status: 404 }
      );
    }

    await db.labelFormat.delete({
      where: { id: formatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting label format:", error);
    return NextResponse.json(
      { message: "Failed to delete label format" },
      { status: 500 }
    );
  }
}
