import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { followup_tasks } from "@/lib/db/schema/followup_tasks";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateTaskSchema = z.object({
  status: z.enum(["scheduled", "sent", "skipped", "stopped"]),
  stopReason: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const tasks = await db
      .select()
      .from(followup_tasks)
      .where(eq(followup_tasks.lead_id, id))
      .orderBy(followup_tasks.created_at);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Follow-up tasks GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const input = updateTaskSchema.parse(body);

    const [task] = await db
      .update(followup_tasks)
      .set({
        status: input.status,
        stop_reason: input.stopReason ?? null,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(followup_tasks.id, id),
          // Only allow updating tasks that are scheduled
          eq(followup_tasks.status, "scheduled")
        )
      )
      .returning();

    if (!task) {
      return NextResponse.json({ error: "Task not found or not scheduled" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Follow-up task PATCH error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 400 });
  }
}
