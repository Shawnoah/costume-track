import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string | null;  // Null for users who haven't completed onboarding
      organizationName: string | null;
      isSystemAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    organizationId: string | null;
    organizationName: string | null;
    isSystemAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    organizationId: string | null;
    organizationName: string | null;
    isSystemAdmin: boolean;
  }
}
