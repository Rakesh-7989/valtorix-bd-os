import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createWorkflowRun, getWorkflowRuns } from "@/lib/workflow/workflow-runner";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRunSchema = z.object({
  workflowId: z.string().uuid(),
  triggerPayload: z.record(z.string(), z.unknown()),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const runs = await getWorkflowRuns();
    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Workflows GET error:", error);
    return NextResponse.json({ error: "Failed to fetch workflow runs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = createRunSchema.parse(body);

    const run = await createWorkflowRun({
      workflowId: input.workflowId,
      triggerPayload: input.triggerPayload,
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error("Workflows POST error:", error);
    return NextResponse.json({ error: "Failed to create workflow run" }, { status: 400 });
  }
}
