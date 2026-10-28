import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { meeting_actions } from "@/lib/db/schema/meeting_actions";
import { meetings } from "@/lib/db/schema/meetings";
import { meetingActionUpdateSchema } from "@/lib/validation/meetings";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";
import { createAuditLog } from "@/lib/workflow/audit-service";

export const dynamic = "force-dynamic";

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
    const validated = meetingActionUpdateSchema.parse(body);

    const [action] = await db
      .update(meeting_actions)
      .set({
        ...validated,
        updated_at: new Date(),
        due_at:
          validated.due_at && validated.due_at !== ""
            ? new Date(validated.due_at)
            : undefined,
      })
      .where(
        and(
          eq(meeting_actions.id, id),
          eq(meeting_actions.status, "open")
        )
      )
      .returning();

    if (!action) {
      return NextResponse.json(
        { error: "Action not found or not open" },
        { status: 404 }
      );
    }

    // Verify org membership through meeting
    const [meeting] = await db
      .select({ organization_id: meetings.organization_id })
      .from(meetings)
      .where(eq(meetings.id, action.meeting_id))
      .limit(1);

    if (!meeting || meeting.organization_id !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await createAuditLog({
      actorType: "user",
      actorId: userId,
      action: "meeting_action_updated",
      entityType: "meeting_action",
      entityId: id,
      details: validated,
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("Meeting action PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update meeting action" },
      { status: 400 }
    );
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
