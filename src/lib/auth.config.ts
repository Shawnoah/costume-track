import type { NextAuthConfig } from "next-auth";

// This config is used by middleware (Edge runtime) - no Prisma here
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.isSystemAdmin = user.isSystemAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.isSystemAdmin = token.isSystemAdmin as boolean;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login") ||
                         nextUrl.pathname.startsWith("/register");
      const isDashboard = nextUrl.pathname.startsWith("/dashboard") ||
                         nextUrl.pathname.startsWith("/inventory") ||
                         nextUrl.pathname.startsWith("/rentals") ||
                         nextUrl.pathname.startsWith("/customers") ||
                         nextUrl.pathname.startsWith("/productions") ||
                         nextUrl.pathname.startsWith("/settings");
      const isHomePage = nextUrl.pathname === "/";
      const isPortal = nextUrl.pathname.startsWith("/portal");

      // Portal pages are public (token-based auth)
      if (isPortal) {
        return true;
      }

      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (isLoggedIn && isHomePage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (!isLoggedIn && isDashboard) {
        return false; // Redirect to signIn page
      }

      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
  session: {
    strategy: "jwt",
  },
};
