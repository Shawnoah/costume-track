import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use edge-safe config only (no Prisma) for proxy
const { auth } = NextAuth(authConfig);

// Next.js 16: middleware.ts → proxy.ts
export default auth;

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
