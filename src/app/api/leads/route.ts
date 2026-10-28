import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema/leads";
import { leadSchema } from "@/lib/validation/leads";
import { eq, and, ilike } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

/**
 * GET /api/leads — List leads for the current organization
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const owner_id = searchParams.get("owner_id") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const conditions = [eq(leads.organization_id, orgId)];

    if (search) {
      conditions.push(ilike(leads.source, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(leads.status, status));
    }

    if (owner_id) {
      conditions.push(eq(leads.owner_id, owner_id));
    }

    const results = await db
      .select()
      .from(leads)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Leads GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads — Create a new lead
 */
export async function POST(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = leadSchema.parse(body);

    const [lead] = await db
      .insert(leads)
      .values({
        ...validated,
        organization_id: orgId,
        primary_contact_id: validated.primary_contact_id || null,
        score_reasons_json: validated.score_reasons_json || null,
        next_action_at:
          validated.next_action_at && validated.next_action_at !== ""
            ? new Date(validated.next_action_at)
            : null,
      })
      .returning();

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Leads POST error:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 400 }
    );
  }
}
