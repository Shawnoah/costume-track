import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const agreementSchema = z.object({
  text: z.string(),
});

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only owners and admins can update agreements
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await safeJsonParse(req);
    if (!body) return badRequestResponse();
    const data = agreementSchema.parse(body);

    await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        rentalAgreementText: data.text || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Agreement update error:", error);
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

    const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { rentalAgreementText: true },
    });

    return NextResponse.json({ text: org?.rentalAgreementText || null });
  } catch (error) {
    console.error("Agreement fetch error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
