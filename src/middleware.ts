import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use auth config without Prisma for Edge middleware
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
