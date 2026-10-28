import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { deals } from "@/lib/db/schema/deals";
import { dealSchema } from "@/lib/validation/deals";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

/**
 * GET /api/deals — List deals for the current organization
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") ?? "";
    const owner_id = searchParams.get("owner_id") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const conditions = [eq(deals.organization_id, orgId)];

    if (stage) {
      conditions.push(eq(deals.stage, stage));
    }

    if (owner_id) {
      conditions.push(eq(deals.owner_id, owner_id));
    }

    const results = await db
      .select()
      .from(deals)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Deals GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deals — Create a new deal
 */
export async function POST(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = dealSchema.parse(body);

    const [deal] = await db
      .insert(deals)
      .values({
        ...validated,
        organization_id: orgId,
        expected_close_at:
          validated.expected_close_at && validated.expected_close_at !== ""
            ? new Date(validated.expected_close_at)
            : null,
        lost_reason: validated.lost_reason || null,
      })
      .returning();

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Deals POST error:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 400 }
    );
  }
}
