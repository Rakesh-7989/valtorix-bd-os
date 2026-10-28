import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema/profiles";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

/**
 * POST /api/auth/register
 * Register a new user account.
 *
 * Phase 1: Simple registration without email verification.
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

    // Create the user
    const [newUser] = await db
      .insert(profiles)
      .values({
        email,
        name,
        password_hash,
      })
      .returning();

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
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
