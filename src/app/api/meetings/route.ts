import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { meetings } from "@/lib/db/schema/meetings";
import { meetingSchema } from "@/lib/validation/meetings";
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

    const conditions = [eq(meetings.organization_id, orgId)];

    if (deal_id) {
      conditions.push(eq(meetings.deal_id, deal_id));
    }

    if (status) {
      conditions.push(eq(meetings.status, status));
    }

    const results = await db
      .select()
      .from(meetings)
      .where(and(...conditions))
      .orderBy(meetings.scheduled_at)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Meetings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
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
    const validated = meetingSchema.parse(body);

    const [meeting] = await db
      .insert(meetings)
      .values({
        ...validated,
        organization_id: orgId,
        created_by: userId,
        agenda: validated.agenda || null,
        scheduled_at: new Date(validated.scheduled_at),
      })
      .returning();

    await createAuditLog({
      actorType: "user",
      actorId: userId,
      action: "meeting_created",
      entityType: "meeting",
      entityId: meeting.id,
      details: { deal_id: validated.deal_id, title: validated.title },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Meetings POST error:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 400 }
    );
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
