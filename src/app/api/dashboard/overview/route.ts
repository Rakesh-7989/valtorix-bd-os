import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema/leads";
import { deals } from "@/lib/db/schema/deals";
import { tasks } from "@/lib/db/schema/tasks";
import { approvals } from "@/lib/db/schema/approvals";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/overview
 * Returns high-level dashboard metrics for the current organization.
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const owner_id = searchParams.get("owner_id") ?? "";

    // Base conditions for org-scoped data
    const leadConditions = [eq(leads.organization_id, orgId)];
    const dealConditions = [eq(deals.organization_id, orgId)];
    const taskConditions = [eq(tasks.organization_id, orgId)];

    if (owner_id) {
      leadConditions.push(eq(leads.owner_id, owner_id));
      dealConditions.push(eq(deals.owner_id, owner_id));
      taskConditions.push(eq(tasks.owner_id, owner_id));
    }

    // Total leads
    const [totalLeadsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(...leadConditions));

    // Qualified leads (status = qualified)
    const [qualifiedLeadsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(...leadConditions, eq(leads.status, "qualified")));

    // Open deals (not closed)
    const [openDealsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          ...dealConditions,
          sql`${deals.stage} NOT IN ('closed_won', 'closed_lost')`
        )
      );

    // Won deals
    const [wonDealsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(and(...dealConditions, eq(deals.stage, "closed_won")));

    // Pipeline value (sum of open deal amounts)
    const [pipelineValueResult] = await db
      .select({ total: sql<number>`coalesce(sum(${deals.amount}), 0)` })
      .from(deals)
      .where(
        and(
          ...dealConditions,
          sql`${deals.stage} NOT IN ('closed_won', 'closed_lost')`
        )
      );

    // Won value
    const [wonValueResult] = await db
      .select({ total: sql<number>`coalesce(sum(${deals.amount}), 0)` })
      .from(deals)
      .where(and(...dealConditions, eq(deals.stage, "closed_won")));

    // Pending approvals (approvals table is not org-scoped, filter by status only)
    const [pendingApprovalsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvals)
      .where(eq(approvals.status, "pending"));

    // Tasks due today
    const [tasksDueResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          ...taskConditions,
          eq(tasks.status, "pending"),
          sql`${tasks.due_at} <= CURRENT_DATE`
        )
      );

    return NextResponse.json({
      metrics: {
        totalLeads: Number(totalLeadsResult?.count || 0),
        qualifiedLeads: Number(qualifiedLeadsResult?.count || 0),
        openDeals: Number(openDealsResult?.count || 0),
        wonDeals: Number(wonDealsResult?.count || 0),
        pipelineValue: Number(pipelineValueResult?.total || 0),
        wonValue: Number(wonValueResult?.total || 0),
        pendingApprovals: Number(pendingApprovalsResult?.count || 0),
        tasksDueToday: Number(tasksDueResult?.count || 0),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
