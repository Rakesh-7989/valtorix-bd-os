import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { proposals } from "@/lib/db/schema/proposals";
import { proposal_items } from "@/lib/db/schema/proposal_items";
import { deals } from "@/lib/db/schema/deals";
import { proposalSchema } from "@/lib/validation/proposals";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";
import { createAuditLog } from "@/lib/workflow/audit-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deal_id = searchParams.get("deal_id") ?? "";
    const status = searchParams.get("status") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const conditions = [eq(proposals.organization_id, orgId)];

    if (deal_id) {
      conditions.push(eq(proposals.deal_id, deal_id));
    }

    if (status) {
      conditions.push(eq(proposals.status, status));
    }

    const results = await db
      .select()
      .from(proposals)
      .where(and(...conditions))
      .orderBy(proposals.created_at)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Proposals GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    const userId = await getCurrentUserId();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = proposalSchema.parse(body);

    // Get the deal to verify it exists and belongs to org
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, validated.deal_id))
      .limit(1);

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Calculate totals
    const subtotal = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const taxAmount = (subtotal * validated.tax_rate) / 100;
    const total = subtotal + taxAmount;

    // Get the next version number
    const [lastVersion] = await db
      .select({ version: proposals.version })
      .from(proposals)
      .where(eq(proposals.deal_id, validated.deal_id))
      .orderBy(proposals.version)
      .limit(1);

    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    const [proposal] = await db
      .insert(proposals)
      .values({
        deal_id: validated.deal_id,
        organization_id: orgId,
        version: nextVersion,
        status: "draft",
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        currency: validated.currency,
      })
      .returning();

    // Insert line items
    await db.insert(proposal_items).values(
      validated.items.map((item, idx) => ({
        proposal_id: proposal.id,
        description: item.description,
        quantity: item.quantity.toFixed(2),
        unit_price: item.unit_price.toFixed(2),
        line_total: (item.quantity * item.unit_price).toFixed(2),
      }))
    );

    await createAuditLog({
      actorType: "user",
      actorId: userId,
      action: "proposal_created",
      entityType: "proposal",
      entityId: proposal.id,
      details: { deal_id: validated.deal_id, version: nextVersion, total },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Proposals POST error:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 400 }
    );
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
