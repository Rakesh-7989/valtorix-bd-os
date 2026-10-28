import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema/profiles";
import { organizations } from "@/lib/db/schema/organizations";
import { organization_members } from "@/lib/db/schema/organization_members";
import { roles } from "@/lib/db/schema/roles";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

/**
 * POST /api/auth/register
 * Register a new user account.
 *
 * Phase 1: Simple registration without email verification.
 * Auto-creates a personal organization for the new user and adds them as admin.
 * In production, add email verification, rate limiting, and organization invitation flow.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Hash the password
    const password_hash = await hash(password, 12);

    // Get the orgadmin role for the new user
    const [orgAdminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "orgadmin"))
      .limit(1);

    if (!orgAdminRole) {
      return NextResponse.json(
        { error: "System configuration error: orgadmin role not found" },
        { status: 500 },
      );
    }

    // Create the user within a transaction
    const result = await db.transaction(async (tx) => {
      // Create the user profile
      const [newUser] = await tx
        .insert(profiles)
        .values({
          email,
          name,
          password_hash,
          role_id: orgAdminRole.id,
        })
        .returning();

      // Create a personal organization for the user
      const slug = email
        .split("@")[0]
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase();

      const [org] = await tx
        .insert(organizations)
        .values({
          name: `${name || email}'s Organization`,
          slug,
        })
        .returning();

      // Add the user as an organization member (orgadmin)
      await tx.insert(organization_members).values({
        organization_id: org.id,
        profile_id: newUser.id,
        role_id: orgAdminRole.id,
      });

      return { newUser, org };
    });

    return NextResponse.json({
      id: result.newUser.id,
      email: result.newUser.email,
      name: result.newUser.name,
      organization_id: result.org.id,
      organization_name: result.org.name,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
