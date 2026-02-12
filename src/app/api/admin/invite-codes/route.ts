import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const createCodeSchema = z.object({
  code: z.string().min(4, "Code must be at least 4 characters").max(32),
  description: z.string().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isSystemAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const codes = await db.systemInviteCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error("Get invite codes error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isSystemAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await safeJsonParse(req);
    if (!body) return badRequestResponse();
    const data = createCodeSchema.parse(body);

    // Check if code already exists
    const existingCode = await db.systemInviteCode.findUnique({
      where: { code: data.code },
    });

    if (existingCode) {
      return NextResponse.json(
        { message: "This code already exists" },
        { status: 400 }
      );
    }

    const inviteCode = await db.systemInviteCode.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdBy: session.user.email,
      },
    });

    return NextResponse.json(inviteCode, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Create invite code error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
