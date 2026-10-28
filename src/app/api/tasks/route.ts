import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema/tasks";
import { taskSchema } from "@/lib/validation/tasks";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

/**
 * GET /api/tasks — List tasks for the current organization
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "";
    const owner_id = searchParams.get("owner_id") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const conditions = [eq(tasks.organization_id, orgId)];

    if (status) {
      conditions.push(eq(tasks.status, status));
    }

    if (owner_id) {
      conditions.push(eq(tasks.owner_id, owner_id));
    }

    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks — Create a new task
 */
export async function POST(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = taskSchema.parse(body);

    const [task] = await db
      .insert(tasks)
      .values({
        ...validated,
        organization_id: orgId,
        lead_id: validated.lead_id || null,
        deal_id: validated.deal_id || null,
        due_at: new Date(validated.due_at),
      })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 400 }
    );
  }
}
