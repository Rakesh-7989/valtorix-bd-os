import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { meeting_actions } from "@/lib/db/schema/meeting_actions";
import { meetings } from "@/lib/db/schema/meetings";
import { meetingActionSchema } from "@/lib/validation/meetings";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";
import { createAuditLog } from "@/lib/workflow/audit-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    const userId = await getCurrentUserId();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = meetingActionSchema.parse(body);

    // Verify the meeting belongs to the org
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, validated.meeting_id))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.organization_id !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [action] = await db
      .insert(meeting_actions)
      .values({
        ...validated,
        due_at:
          validated.due_at && validated.due_at !== ""
            ? new Date(validated.due_at)
            : null,
      })
      .returning();

    await createAuditLog({
      actorType: "user",
      actorId: userId,
      action: "meeting_action_created",
      entityType: "meeting_action",
      entityId: action.id,
      details: { meeting_id: validated.meeting_id },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Meeting actions POST error:", error);
    return NextResponse.json(
      { error: "Failed to create meeting action" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const meeting_id = searchParams.get("meeting_id") ?? "";

    const conditions = [];

    if (meeting_id) {
      conditions.push(eq(meeting_actions.meeting_id, meeting_id));
    }

    const results = await db
      .select()
      .from(meeting_actions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(meeting_actions.created_at);

    return NextResponse.json({
      data: results,
    });
  } catch (error) {
    console.error("Meeting actions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting actions" },
      { status: 500 }
    );
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
