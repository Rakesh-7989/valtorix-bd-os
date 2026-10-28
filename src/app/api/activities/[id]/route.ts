import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { activities } from "@/lib/db/schema/activities";
import { activityUpdateSchema } from "@/lib/validation/activities";
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

    const [activity] = await db
      .select()
      .from(activities)
      .where(
        and(eq(activities.id, id), eq(activities.organization_id, orgId))
      )
      .limit(1);

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Activities GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
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
    const validated = activityUpdateSchema.parse(body);

    const [activity] = await db
      .update(activities)
      .set({
        ...validated,
        occurred_at:
          validated.occurred_at && validated.occurred_at !== ""
            ? new Date(validated.occurred_at)
            : undefined,
      })
      .where(
        and(eq(activities.id, id), eq(activities.organization_id, orgId))
      )
      .returning();

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Activities PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
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
      .delete(activities)
      .where(
        and(eq(activities.id, id), eq(activities.organization_id, orgId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Activity deleted" });
  } catch (error) {
    console.error("Activities DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}
