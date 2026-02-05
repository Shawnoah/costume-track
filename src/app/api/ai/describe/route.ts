import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

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
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { message: "AI features not configured. Please add ANTHROPIC_API_KEY to your environment." },
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
      },
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

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

    const body = await req.json();
    const { imageUrl, existingName } = describeSchema.parse(body);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

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

    const prompt = existingName
      ? `You are helping a costume rental shop catalog their inventory. Analyze this costume photo and provide a detailed description.

The costume is named: "${existingName}"

Provide a JSON response with the following fields:
- description: A detailed 2-3 sentence description of the costume suitable for a rental catalog. Focus on style, notable features, materials (if visible), and what type of character or era it would suit.
- era: The historical era or time period the costume represents (e.g., "Victorian", "1920s Flapper", "Medieval", "Contemporary", "Fantasy"). Be specific if possible.
- color: The primary color(s) of the costume (e.g., "Deep burgundy", "Black and gold", "Cream with silver accents")
- suggestedCategory: What category this costume might belong to (e.g., "Formal Wear", "Period Costume", "Fantasy", "Uniforms", "Casual Wear")

Respond only with valid JSON, no markdown.`
      : `You are helping a costume rental shop catalog their inventory. Analyze this costume photo and provide details.

Provide a JSON response with the following fields:
- suggestedName: A descriptive name for this costume (e.g., "Victorian Ball Gown", "1920s Gangster Suit", "Medieval Knight Armor")
- description: A detailed 2-3 sentence description of the costume suitable for a rental catalog. Focus on style, notable features, materials (if visible), and what type of character or era it would suit.
- era: The historical era or time period the costume represents (e.g., "Victorian", "1920s Flapper", "Medieval", "Contemporary", "Fantasy"). Be specific if possible.
- color: The primary color(s) of the costume (e.g., "Deep burgundy", "Black and gold", "Cream with silver accents")
- suggestedCategory: What category this costume might belong to (e.g., "Formal Wear", "Period Costume", "Fantasy", "Uniforms", "Casual Wear")

Respond only with valid JSON, no markdown.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract the text response
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { message: "No response from AI" },
        { status: 500 }
      );
    }

    // Deduct credits and log usage
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
          metadata: { imageUrl, existingName },
        },
      }),
    ]);

    // Parse the JSON response
    try {
      const result = JSON.parse(textContent.text);
      return NextResponse.json(result);
    } catch {
      // If JSON parsing fails, return the raw text
      return NextResponse.json({
        description: textContent.text,
        error: "Could not parse structured response",
      });
    }
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
