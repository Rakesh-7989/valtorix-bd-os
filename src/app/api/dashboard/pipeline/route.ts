import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema/leads";
import { deals } from "@/lib/db/schema/deals";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/pipeline
 * Returns pipeline distribution by stage for leads and deals.
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const owner_id = searchParams.get("owner_id") ?? "";

    const leadConditions = [eq(leads.organization_id, orgId)];
    const dealConditions = [eq(deals.organization_id, orgId)];

    if (owner_id) {
      leadConditions.push(eq(leads.owner_id, owner_id));
      dealConditions.push(eq(deals.owner_id, owner_id));
    }

    // Leads by stage
    const leadsByStage = await db
      .select({
        stage: leads.status,
        count: sql<number>`count(*)`,
      })
      .from(leads)
      .where(and(...leadConditions))
      .groupBy(leads.status);

    // Deals by stage
    const dealsByStage = await db
      .select({
        stage: deals.stage,
        count: sql<number>`count(*)`,
        value: sql<number>`coalesce(sum(${deals.amount}), 0)`,
      })
      .from(deals)
      .where(and(...dealConditions))
      .groupBy(deals.stage);

    return NextResponse.json({
      leadsByStage: leadsByStage.map((r) => ({
        stage: r.stage,
        count: Number(r.count),
      })),
      dealsByStage: dealsByStage.map((r) => ({
        stage: r.stage,
        count: Number(r.count),
        value: Number(r.value),
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard pipeline error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline metrics" },
      { status: 500 }
    );
  }
}
