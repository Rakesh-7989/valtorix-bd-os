import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createApproval, getPendingApprovals } from "@/lib/workflow/approval-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createApprovalSchema = z.object({
  workflowRunId: z.string().uuid(),
  actionType: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  payload: z.record(z.string(), z.unknown()),
  expiresInMinutes: z.number().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await getPendingApprovals();
    return NextResponse.json({ approvals: pending });
  } catch (error) {
    console.error("Approvals GET error:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = createApprovalSchema.parse(body);

    const approval = await createApproval({
      ...input,
      requestedBy: session.user.id,
    });

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Approvals POST error:", error);
    return NextResponse.json({ error: "Failed to create approval" }, { status: 400 });
  }
}
