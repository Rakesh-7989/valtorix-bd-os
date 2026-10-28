import { NextAuthOptions, DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema/profiles";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

/**
 * Extend NextAuth types to include custom fields.
 */

declare module "next-auth" {
  interface User {
    id: string;
    role_id?: string;
  }

  interface Session {
    user: {
      id: string;
      role_id?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role_id?: string;
  }
}

/**
 * NextAuth configuration for VALTORIX BD OS.
 *
 * Uses the credentials provider (email + password) for internal users.
 * Passwords are hashed with bcryptjs before storage.
 * Sessions are JWT-based (no database session table needed for Phase 1).
 */

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(profiles)
          .where(eq(profiles.email, credentials.email))
          .limit(1);

        if (user.length === 0) {
          return null;
        }

        const profile = user[0];
        const isValid = await compare(
          credentials.password,
          profile.password_hash ?? "",
        );

        if (!isValid) {
          return null;
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role_id: profile.role_id?.toString(),
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role_id = user.role_id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id;
        session.user.role_id = token.role_id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
};
