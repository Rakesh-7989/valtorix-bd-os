import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { handover_records } from "@/lib/db/schema/handover_records";
import { handoverSchema, handoverUpdateSchema } from "@/lib/validation/handover";
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

    const [handover] = await db
      .select()
      .from(handover_records)
      .where(
        and(eq(handover_records.deal_id, id), eq(handover_records.organization_id, orgId))
      )
      .limit(1);

    if (!handover) {
      return NextResponse.json({ error: "Handover not found" }, { status: 404 });
    }

    return NextResponse.json(handover);
  } catch (error) {
    console.error("Handover GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch handover" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const validated = handoverSchema.parse(body);

    // Check if handover already exists for this deal
    const [existing] = await db
      .select()
      .from(handover_records)
      .where(eq(handover_records.deal_id, id))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Handover already exists for this deal" },
        { status: 409 }
      );
    }

    const [handover] = await db
      .insert(handover_records)
      .values({
        deal_id: id,
        organization_id: orgId,
        scope_json: validated.scope_json || null,
        requirements_json: validated.requirements_json || null,
        delivery_notes: validated.delivery_notes || null,
        created_by: userId,
        status: "pending",
      })
      .returning();

    await createAuditLog({
      actorType: "user",
      actorId: userId,
      action: "handover_created",
      entityType: "handover_record",
      entityId: handover.id,
      details: { deal_id: id },
    });

    return NextResponse.json(handover, { status: 201 });
  } catch (error) {
    console.error("Handover POST error:", error);
    return NextResponse.json(
      { error: "Failed to create handover" },
      { status: 400 }
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
    const validated = handoverUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {
      ...validated,
      updated_at: new Date(),
    };

    if (validated.status === "completed") {
      updateData.completed_at = new Date();
    }

    const [handover] = await db
      .update(handover_records)
      .set(updateData)
      .where(
        and(
          eq(handover_records.deal_id, id),
          eq(handover_records.organization_id, orgId)
        )
      )
      .returning();

    if (!handover) {
      return NextResponse.json({ error: "Handover not found" }, { status: 404 });
    }

    await createAuditLog({
      actorType: "user",
      actorId: userId,
      action: "handover_updated",
      entityType: "handover_record",
      entityId: handover.id,
      details: validated,
    });

    return NextResponse.json(handover);
  } catch (error) {
    console.error("Handover PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update handover" },
      { status: 400 }
    );
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
