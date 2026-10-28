import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema/leads";
import { leadUpdateSchema } from "@/lib/validation/leads";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(eq(leads.id, id), eq(leads.organization_id, orgId))
      )
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Leads GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = leadUpdateSchema.parse(body);

    const [lead] = await db
      .update(leads)
      .set({
        ...validated,
        updated_at: new Date(),
        next_action_at:
          validated.next_action_at && validated.next_action_at !== ""
            ? new Date(validated.next_action_at)
            : undefined,
      })
      .where(
        and(eq(leads.id, id), eq(leads.organization_id, orgId))
      )
      .returning();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Leads PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deleted] = await db
      .delete(leads)
      .where(
        and(eq(leads.id, id), eq(leads.organization_id, orgId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Lead deleted" });
  } catch (error) {
    console.error("Leads DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
