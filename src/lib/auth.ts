import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "./db";
import { authConfig } from "./auth.config";

// System admin emails - these users have full access to all organizations
const SYSTEM_ADMIN_EMAILS = [
  "shawnoah.pollock@gmail.com",
];

export function isSystemAdminEmail(email: string): boolean {
  return SYSTEM_ADMIN_EMAILS.includes(email.toLowerCase());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name || null,
          isSystemAdmin: isSystemAdminEmail(user.email),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // For OAuth sign-ins, create or update user in database
      if (account?.provider === "google" && user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
          include: { organization: true },
        });

        if (existingUser) {
          // Update existing user with OAuth info if needed
          if (!existingUser.image && user.image) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { image: user.image },
            });
          }
        } else {
          // Create new user without organization (they'll set it up later)
          await db.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split("@")[0],
              image: user.image,
              role: "OWNER", // New OAuth users become owners of their org
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.isSystemAdmin = user.isSystemAdmin;
        token.image = user.image;
      }

      // OAuth sign in - fetch user data from database
      if (account?.provider === "google" && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          include: { organization: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
          token.organizationName = dbUser.organization?.name || null;
          token.isSystemAdmin = isSystemAdminEmail(dbUser.email);
          token.image = dbUser.image;
        }
      }

      // Refresh user data on session update
      if (trigger === "update" && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
          include: { organization: true },
        });
        if (dbUser) {
          token.organizationId = dbUser.organizationId;
          token.organizationName = dbUser.organization?.name || null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string | null;
        session.user.organizationName = token.organizationName as string | null;
        session.user.isSystemAdmin = token.isSystemAdmin as boolean;
        session.user.image = token.image as string | null;
      }
      return session;
    },
  },
});
