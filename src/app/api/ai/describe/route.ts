import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { analyzeCostumeImage, isAIConfigured, getDefaultProvider } from "@/lib/ai";
import { isSuperAdmin } from "@/lib/superadmin";

const describeSchema = z.object({
  imageUrl: z.string().url(),
  existingName: z.string().optional(),
});

const AI_CREDIT_COST = 1; // Cost per describe operation

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if AI is configured
    if (!isAIConfigured()) {
      const provider = getDefaultProvider();
      return NextResponse.json(
        { message: `AI features not configured. Please add ${provider === "gemini" ? "GOOGLE_AI_API_KEY" : "ANTHROPIC_API_KEY"} to your environment.` },
        { status: 503 }
      );
    }

    // Check plan tier and credits
    const organization = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        planTier: true,
        aiCredits: true,
        aiCreditsIncluded: true,
        unlimitedAiCredits: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    // Check if user has unlimited access (superadmin or org setting)
    const hasUnlimitedAccess = organization.unlimitedAiCredits || isSuperAdmin(session.user.email);

    // Skip tier/credit checks if has unlimited access
    if (!hasUnlimitedAccess) {
      // Check if organization has access to AI features
      if (organization.planTier === "CORE") {
        return NextResponse.json(
          { message: "AI features require a Pro or Team plan. Please upgrade to use this feature." },
          { status: 403 }
        );
      }

      // Check AI credits
      if (organization.aiCredits < AI_CREDIT_COST) {
        return NextResponse.json(
          { message: "Insufficient AI credits. Please purchase more credits or wait for your monthly reset." },
          { status: 402 }
        );
      }
    }

    const body = await req.json();
    const { imageUrl, existingName } = describeSchema.parse(body);

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { message: "Failed to fetch image" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Use the engine-agnostic AI abstraction
    const result = await analyzeCostumeImage(base64Image, contentType, existingName);

    // Deduct credits (unless unlimited) and log usage
    if (hasUnlimitedAccess) {
      // Just log usage without deducting credits
      await db.aIUsageLog.create({
        data: {
          type: "GENERATE_DESC",
          creditsUsed: 0,
          organizationId: session.user.organizationId,
          userId: session.user.id,
          metadata: { imageUrl, existingName, provider: getDefaultProvider(), unlimited: true },
        },
      });
    } else {
      await db.$transaction([
        db.organization.update({
          where: { id: session.user.organizationId },
          data: { aiCredits: { decrement: AI_CREDIT_COST } },
        }),
        db.aIUsageLog.create({
          data: {
            type: "GENERATE_DESC",
            creditsUsed: AI_CREDIT_COST,
            organizationId: session.user.organizationId,
            userId: session.user.id,
            metadata: { imageUrl, existingName, provider: getDefaultProvider() },
          },
        }),
      ]);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("AI describe error:", error);
    return NextResponse.json(
      { message: "Something went wrong with AI processing" },
      { status: 500 }
    );
  }
}
