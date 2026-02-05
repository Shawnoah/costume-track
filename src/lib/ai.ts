/**
 * Engine-agnostic AI provider abstraction
 * Supports multiple providers: Gemini (default), Anthropic, OpenAI
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Types for the AI abstraction
export interface CostumeAnalysisResult {
  suggestedName?: string;
  description: string;
  era?: string;
  color?: string;
  suggestedCategory?: string;
  error?: string;
}

export interface AIProviderConfig {
  provider: "gemini" | "anthropic" | "openai";
}

// Default to Gemini Flash for best cost/latency/quality balance for image analysis
const DEFAULT_PROVIDER: AIProviderConfig["provider"] = "gemini";

// Lazy-loaded Gemini client
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }
  return geminiClient;
}

// Build the prompt for costume analysis
function buildPrompt(existingName?: string): string {
  if (existingName) {
    return `You are helping a costume rental shop catalog their inventory. Analyze this costume photo and provide a detailed description.

The costume is named: "${existingName}"

Provide a JSON response with the following fields:
- description: A detailed 2-3 sentence description of the costume suitable for a rental catalog. Focus on style, notable features, materials (if visible), and what type of character or era it would suit.
- era: The historical era or time period the costume represents (e.g., "Victorian", "1920s Flapper", "Medieval", "Contemporary", "Fantasy"). Be specific if possible.
- color: The primary color(s) of the costume (e.g., "Deep burgundy", "Black and gold", "Cream with silver accents")
- suggestedCategory: What category this costume might belong to (e.g., "Formal Wear", "Period Costume", "Fantasy", "Uniforms", "Casual Wear")

Respond only with valid JSON, no markdown.`;
  }

  return `You are helping a costume rental shop catalog their inventory. Analyze this costume photo and provide details.

Provide a JSON response with the following fields:
- suggestedName: A descriptive name for this costume (e.g., "Victorian Ball Gown", "1920s Gangster Suit", "Medieval Knight Armor")
- description: A detailed 2-3 sentence description of the costume suitable for a rental catalog. Focus on style, notable features, materials (if visible), and what type of character or era it would suit.
- era: The historical era or time period the costume represents (e.g., "Victorian", "1920s Flapper", "Medieval", "Contemporary", "Fantasy"). Be specific if possible.
- color: The primary color(s) of the costume (e.g., "Deep burgundy", "Black and gold", "Cream with silver accents")
- suggestedCategory: What category this costume might belong to (e.g., "Formal Wear", "Period Costume", "Fantasy", "Uniforms", "Casual Wear")

Respond only with valid JSON, no markdown.`;
}

// Analyze costume with Gemini Flash
async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string,
  existingName?: string
): Promise<CostumeAnalysisResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = buildPrompt(existingName);

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    },
    { text: prompt },
  ]);

  const response = result.response;
  const text = response.text();

  // Parse JSON response
  try {
    // Clean the response in case it has markdown code blocks
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch {
    return {
      description: text,
      error: "Could not parse structured response",
    };
  }
}

// Analyze costume with Anthropic (fallback)
async function analyzeWithAnthropic(
  imageBase64: string,
  mimeType: string,
  existingName?: string
): Promise<CostumeAnalysisResult> {
  // Dynamic import to avoid loading SDK when not needed
  const Anthropic = (await import("@anthropic-ai/sdk")).default;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildPrompt(existingName);

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
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
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

  const textContent = message.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No response from AI");
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return {
      description: textContent.text,
      error: "Could not parse structured response",
    };
  }
}

// Main function to analyze costume - provider agnostic
export async function analyzeCostumeImage(
  imageBase64: string,
  mimeType: string,
  existingName?: string,
  provider?: AIProviderConfig["provider"]
): Promise<CostumeAnalysisResult> {
  const selectedProvider = provider || DEFAULT_PROVIDER;

  switch (selectedProvider) {
    case "gemini":
      return analyzeWithGemini(imageBase64, mimeType, existingName);
    case "anthropic":
      return analyzeWithAnthropic(imageBase64, mimeType, existingName);
    case "openai":
      throw new Error("OpenAI provider not yet implemented");
    default:
      throw new Error(`Unknown AI provider: ${selectedProvider}`);
  }
}

// Helper to check if AI is configured
export function isAIConfigured(provider?: AIProviderConfig["provider"]): boolean {
  const selectedProvider = provider || DEFAULT_PROVIDER;

  switch (selectedProvider) {
    case "gemini":
      return !!process.env.GOOGLE_AI_API_KEY;
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    default:
      return false;
  }
}

// Get the current default provider
export function getDefaultProvider(): AIProviderConfig["provider"] {
  return DEFAULT_PROVIDER;
}
