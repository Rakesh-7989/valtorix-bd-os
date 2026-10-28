import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { meetings } from "@/lib/db/schema/meetings";
import { meetingUpdateSchema } from "@/lib/validation/meetings";
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

    const [meeting] = await db
      .select()
      .from(meetings)
      .where(
        and(eq(meetings.id, id), eq(meetings.organization_id, orgId))
      )
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Meetings GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
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
    const validated = meetingUpdateSchema.parse(body);

    const [meeting] = await db
      .update(meetings)
      .set({
        ...validated,
        updated_at: new Date(),
        scheduled_at:
          validated.scheduled_at && validated.scheduled_at !== ""
            ? new Date(validated.scheduled_at)
            : undefined,
      })
      .where(
        and(eq(meetings.id, id), eq(meetings.organization_id, orgId))
      )
      .returning();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await createAuditLog({
      actorType: "user",
      actorId: userId,
      action: "meeting_updated",
      entityType: "meeting",
      entityId: id,
      details: validated,
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Meetings PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
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
      .delete(meetings)
      .where(
        and(eq(meetings.id, id), eq(meetings.organization_id, orgId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Meeting deleted" });
  } catch (error) {
    console.error("Meetings DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
