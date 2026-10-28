import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDueJobs, getJobsForRun } from "@/lib/workflow/job-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workflowRunId = searchParams.get("workflowRunId");

    if (workflowRunId) {
      const jobs = await getJobsForRun(workflowRunId);
      return NextResponse.json({ jobs });
    }

    const due = await getDueJobs();
    return NextResponse.json({ jobs: due });
  } catch (error) {
    console.error("Jobs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
