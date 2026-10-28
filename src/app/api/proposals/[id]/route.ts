import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { proposals } from "@/lib/db/schema/proposals";
import { proposal_items } from "@/lib/db/schema/proposal_items";
import { proposalUpdateSchema, proposalStatusSchema } from "@/lib/validation/proposals";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";
import { createAuditLog } from "@/lib/workflow/audit-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [proposal] = await db
      .select()
      .from(proposals)
      .where(
        and(eq(proposals.id, id), eq(proposals.organization_id, orgId))
      )
      .limit(1);

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(proposal_items)
      .where(eq(proposal_items.proposal_id, id));

    return NextResponse.json({ ...proposal, items });
  } catch (error) {
    console.error("Proposals GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposal" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getCurrentUserOrgId();
    const userId = await getCurrentUserId();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if it's a status update
    const statusResult = proposalStatusSchema.safeParse(body);
    if (statusResult.success) {
      const [proposal] = await db
        .update(proposals)
        .set({
          status: statusResult.data.status,
          updated_at: new Date(),
          ...(statusResult.data.status === "approved"
            ? { approved_by: userId, approved_at: new Date() }
            : {}),
        })
        .where(
          and(eq(proposals.id, id), eq(proposals.organization_id, orgId))
        )
        .returning();

      if (!proposal) {
        return NextResponse.json(
          { error: "Proposal not found" },
          { status: 404 }
        );
      }

      await createAuditLog({
        actorType: "user",
        actorId: userId,
        action: `proposal_${statusResult.data.status}`,
        entityType: "proposal",
        entityId: id,
        details: { status: statusResult.data.status },
      });

      return NextResponse.json(proposal);
    }

    // Regular update
    const validated = proposalUpdateSchema.parse(body);

    const [proposal] = await db
      .update(proposals)
      .set({
        ...validated,
        updated_at: new Date(),
      })
      .where(
        and(eq(proposals.id, id), eq(proposals.organization_id, orgId))
      )
      .returning();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    await createAuditLog({
      actorType: "user",
      actorId: userId,
      action: "proposal_updated",
      entityType: "proposal",
      entityId: id,
      details: validated,
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Proposals PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(proposals)
      .where(
        and(eq(proposals.id, id), eq(proposals.organization_id, orgId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Proposal deleted" });
  } catch (error) {
    console.error("Proposals DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete proposal" },
      { status: 500 }
    );
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
