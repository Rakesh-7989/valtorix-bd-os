import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema/tasks";
import { taskUpdateSchema } from "@/lib/validation/tasks";
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

    const [task] = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, id), eq(tasks.organization_id, orgId))
      )
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Tasks GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
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
    const validated = taskUpdateSchema.parse(body);

    const [task] = await db
      .update(tasks)
      .set({
        ...validated,
        updated_at: new Date(),
        due_at:
          validated.due_at && validated.due_at !== ""
            ? new Date(validated.due_at)
            : undefined,
      })
      .where(
        and(eq(tasks.id, id), eq(tasks.organization_id, orgId))
      )
      .returning();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Tasks PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
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
      .delete(tasks)
      .where(
        and(eq(tasks.id, id), eq(tasks.organization_id, orgId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Tasks DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
