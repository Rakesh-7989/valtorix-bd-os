import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decideApproval, getApproval, cancelApproval } from "@/lib/workflow/approval-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const decideSchema = z.object({
  decision: z.enum(["approve", "reject"]),
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
    const approval = await getApproval(id);

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Approval GET error:", error);
    return NextResponse.json({ error: "Failed to fetch approval" }, { status: 500 });
  }
}

export async function POST(
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
    const { decision } = decideSchema.parse(body);

    const updated = await decideApproval({
      approvalId: id,
      reviewerId: session.user.id,
      decision,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Approval POST error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cancelled = await cancelApproval(id, session.user.id);

    if (!cancelled) {
      return NextResponse.json({ error: "Approval not found or already decided" }, { status: 404 });
    }

    return NextResponse.json({ message: "Approval cancelled" });
  } catch (error) {
    console.error("Approval DELETE error:", error);
    return NextResponse.json({ error: "Failed to cancel approval" }, { status: 500 });
  }
}
