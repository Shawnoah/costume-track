import { NextResponse } from "next/server";

/**
 * Safely parse JSON from a request body.
 * Returns null if the client disconnected (ECONNRESET) or sent invalid JSON.
 */
export async function safeJsonParse(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

/**
 * Returns a 400 response for invalid/missing request body.
 */
export function badRequestResponse(message = "Invalid or missing request body") {
  return NextResponse.json({ message }, { status: 400 });
}
