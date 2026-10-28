import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { activities } from "@/lib/db/schema/activities";
import { activitySchema } from "@/lib/validation/activities";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId, getCurrentUserId } from "@/lib/auth-helper";

/**
 * GET /api/activities — List activities for the current organization
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lead_id = searchParams.get("lead_id") ?? "";
    const deal_id = searchParams.get("deal_id") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const conditions = [eq(activities.organization_id, orgId)];

    if (lead_id) {
      conditions.push(eq(activities.lead_id, lead_id));
    }

    if (deal_id) {
      conditions.push(eq(activities.deal_id, deal_id));
    }

    const results = await db
      .select()
      .from(activities)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Activities GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activities — Create a new activity
 */
export async function POST(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    const userId = await getCurrentUserId();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = activitySchema.parse(body);

    const [activity] = await db
      .insert(activities)
      .values({
        ...validated,
        organization_id: orgId,
        created_by: userId,
        lead_id: validated.lead_id || null,
        deal_id: validated.deal_id || null,
        occurred_at: validated.occurred_at
          ? new Date(validated.occurred_at)
          : new Date(),
      })
      .returning();

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Activities POST error:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 400 }
    );
  }
}
