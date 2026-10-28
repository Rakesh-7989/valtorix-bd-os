import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { deals } from "@/lib/db/schema/deals";
import { dealUpdateSchema } from "@/lib/validation/deals";
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

    const [deal] = await db
      .select()
      .from(deals)
      .where(
        and(eq(deals.id, id), eq(deals.organization_id, orgId))
      )
      .limit(1);

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Deals GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal" },
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
    const validated = dealUpdateSchema.parse(body);

    const [deal] = await db
      .update(deals)
      .set({
        ...validated,
        updated_at: new Date(),
        expected_close_at:
          validated.expected_close_at && validated.expected_close_at !== ""
            ? new Date(validated.expected_close_at)
            : undefined,
      })
      .where(
        and(eq(deals.id, id), eq(deals.organization_id, orgId))
      )
      .returning();

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Deals PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update deal" },
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
      .delete(deals)
      .where(
        and(eq(deals.id, id), eq(deals.organization_id, orgId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deal deleted" });
  } catch (error) {
    console.error("Deals DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
