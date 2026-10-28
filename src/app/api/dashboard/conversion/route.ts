import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema/leads";
import { deals } from "@/lib/db/schema/deals";
import { meetings } from "@/lib/db/schema/meetings";
import { proposals } from "@/lib/db/schema/proposals";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/conversion
 * Returns conversion funnel metrics: lead → qualified → meeting → proposal → won
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

    // Total leads
    const [totalLeads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(...leadConditions));

    // Qualified leads
    const [qualifiedLeads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(...leadConditions, eq(leads.status, "qualified")));

    // Leads with meetings
    const [leadsWithMeetings] = await db
      .select({ count: sql<number>`count(distinct ${leads.id})` })
      .from(leads)
      .innerJoin(meetings, eq(meetings.deal_id, leads.id))
      .where(and(...leadConditions));

    // Leads with proposals
    const [leadsWithProposals] = await db
      .select({ count: sql<number>`count(distinct ${leads.id})` })
      .from(leads)
      .innerJoin(proposals, eq(proposals.deal_id, leads.id))
      .where(and(...leadConditions));

    // Won deals
    const [wonDeals] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(and(...dealConditions, eq(deals.stage, "closed_won")));

    const total = Number(totalLeads?.count || 0);
    const qualified = Number(qualifiedLeads?.count || 0);
    const withMeetings = Number(leadsWithMeetings?.count || 0);
    const withProposals = Number(leadsWithProposals?.count || 0);
    const won = Number(wonDeals?.count || 0);

    const funnel = [
      { stage: "Lead", count: total, conversion: 100 },
      { stage: "Qualified", count: qualified, conversion: total > 0 ? Math.round((qualified / total) * 100) : 0 },
      { stage: "Meeting", count: withMeetings, conversion: total > 0 ? Math.round((withMeetings / total) * 100) : 0 },
      { stage: "Proposal", count: withProposals, conversion: total > 0 ? Math.round((withProposals / total) * 100) : 0 },
      { stage: "Won", count: won, conversion: total > 0 ? Math.round((won / total) * 100) : 0 },
    ];

    return NextResponse.json({
      funnel,
      metrics: {
        totalLeads: total,
        qualifiedLeads: qualified,
        leadsWithMeetings: withMeetings,
        leadsWithProposals: withProposals,
        wonDeals: won,
        leadToQualifiedRate: total > 0 ? Math.round((qualified / total) * 100) : 0,
        qualifiedToMeetingRate: qualified > 0 ? Math.round((withMeetings / qualified) * 100) : 0,
        meetingToProposalRate: withMeetings > 0 ? Math.round((withProposals / withMeetings) * 100) : 0,
        proposalToWinRate: withProposals > 0 ? Math.round((won / withProposals) * 100) : 0,
        overallWinRate: total > 0 ? Math.round((won / total) * 100) : 0,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard conversion error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion metrics" },
      { status: 500 }
    );
  }
}
