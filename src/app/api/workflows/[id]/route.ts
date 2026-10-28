import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWorkflowRun } from "@/lib/workflow/workflow-runner";

export const dynamic = "force-dynamic";

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
    const run = await getWorkflowRun(id);

    if (!run) {
      return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Workflow run GET error:", error);
    return NextResponse.json({ error: "Failed to fetch workflow run" }, { status: 500 });
  }
}
