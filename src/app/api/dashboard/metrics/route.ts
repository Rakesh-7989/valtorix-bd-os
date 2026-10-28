import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema/leads";
import { deals } from "@/lib/db/schema/deals";
import { activities } from "@/lib/db/schema/activities";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/metrics
 * Returns time-series metrics for charts.
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "30d"; // 7d, 30d, 90d
    const owner_id = searchParams.get("owner_id") ?? "";

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const leadConditions = [
      eq(leads.organization_id, orgId),
      sql`${leads.created_at} >= ${startDate}`,
    ];
    const dealConditions = [
      eq(deals.organization_id, orgId),
      sql`${deals.created_at} >= ${startDate}`,
    ];
    const activityConditions = [
      eq(activities.organization_id, orgId),
      sql`${activities.created_at} >= ${startDate}`,
    ];

    if (owner_id) {
      leadConditions.push(eq(leads.owner_id, owner_id));
      dealConditions.push(eq(deals.owner_id, owner_id));
      activityConditions.push(eq(activities.created_by, owner_id));
    }

    // Leads created per day
    const leadsPerDay = await db
      .select({
        date: sql<string>`date(${leads.created_at})`,
        count: sql<number>`count(*)`,
      })
      .from(leads)
      .where(and(...leadConditions))
      .groupBy(sql`date(${leads.created_at})`)
      .orderBy(sql`date(${leads.created_at})`);

    // Deals created per day
    const dealsPerDay = await db
      .select({
        date: sql<string>`date(${deals.created_at})`,
        count: sql<number>`count(*)`,
      })
      .from(deals)
      .where(and(...dealConditions))
      .groupBy(sql`date(${deals.created_at})`)
      .orderBy(sql`date(${deals.created_at})`);

    // Activities per day
    const activitiesPerDay = await db
      .select({
        date: sql<string>`date(${activities.created_at})`,
        count: sql<number>`count(*)`,
      })
      .from(activities)
      .where(and(...activityConditions))
      .groupBy(sql`date(${activities.created_at})`)
      .orderBy(sql`date(${activities.created_at})`);

    return NextResponse.json({
      period,
      leadsPerDay: leadsPerDay.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      dealsPerDay: dealsPerDay.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      activitiesPerDay: activitiesPerDay.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
