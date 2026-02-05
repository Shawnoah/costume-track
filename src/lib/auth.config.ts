import type { NextAuthConfig } from "next-auth";

// This config is used by middleware (Edge runtime) - no Prisma here
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const hasOrganization = !!auth?.user?.organizationId;
      const isAuthPage = nextUrl.pathname.startsWith("/login") ||
                         nextUrl.pathname.startsWith("/register");
      const isOnboardingPage = nextUrl.pathname.startsWith("/onboarding");
      const isDashboard = nextUrl.pathname.startsWith("/dashboard") ||
                         nextUrl.pathname.startsWith("/inventory") ||
                         nextUrl.pathname.startsWith("/rentals") ||
                         nextUrl.pathname.startsWith("/customers") ||
                         nextUrl.pathname.startsWith("/productions") ||
                         nextUrl.pathname.startsWith("/settings");
      const isHomePage = nextUrl.pathname === "/";
      const isPortal = nextUrl.pathname.startsWith("/portal");
      const isPublicOrgPage = /^\/[a-z0-9-]+$/.test(nextUrl.pathname) &&
                              !isDashboard && !isAuthPage && !isOnboardingPage;

      // Portal pages are public (token-based auth)
      if (isPortal) {
        return true;
      }

      // Public organization pages (/{slug}) are accessible
      if (isPublicOrgPage) {
        return true;
      }

      // Logged in but no organization - redirect to onboarding
      if (isLoggedIn && !hasOrganization && !isOnboardingPage && !isAuthPage) {
        return Response.redirect(new URL("/onboarding", nextUrl));
      }

      // On onboarding page but already has organization - go to dashboard
      if (isLoggedIn && hasOrganization && isOnboardingPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
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

      if (!isLoggedIn && isOnboardingPage) {
        return false; // Redirect to signIn page
      }

      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days - ensures cookie persists
      },
    },
  },
};
