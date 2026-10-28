import { db } from "@/lib/db/client";
import { workflow_runs } from "@/lib/db/schema/workflow_runs";
import { audit_logs } from "@/lib/db/schema/audit_logs";
import { eq } from "drizzle-orm";

export type WorkflowRunStatus = "running" | "completed" | "failed" | "cancelled" | "waiting_for_approval";

export interface CreateWorkflowRunInput {
  workflowId: string;
  triggerPayload: Record<string, unknown>;
}

/**
 * Workflow Runner — manages workflow state transitions.
 *
 * A workflow run is a persistent state machine. Each step creates jobs,
 * waits for approvals, or transitions to the next state.
 * On restart, the runner resumes from the last saved state.
 */

export async function createWorkflowRun(input: CreateWorkflowRunInput) {
  const [run] = await db
    .insert(workflow_runs)
    .values({
      workflow_id: input.workflowId,
      status: "running",
      trigger_payload_json: input.triggerPayload,
      current_state_json: { step: "started", status: "running" },
    })
    .returning();

  await db.insert(audit_logs).values({
    actor_type: "system",
    actor_id: "workflow-engine",
    action: "workflow_run_created",
    entity_type: "workflow_run",
    entity_id: run.id,
    details_json: { workflow_id: input.workflowId },
  });

  return run;
}

/**
 * Get a workflow run by ID.
 */
export async function getWorkflowRun(runId: string) {
  const [run] = await db
    .select()
    .from(workflow_runs)
    .where(eq(workflow_runs.id, runId))
    .limit(1);
  return run;
}

/**
 * Update workflow run state.
 */
export async function updateWorkflowRun(
  runId: string,
  updates: Partial<{
    status: WorkflowRunStatus;
    current_state_json: Record<string, unknown>;
    error_summary: string;
  }>
) {
  const [run] = await db
    .update(workflow_runs)
    .set({
      ...updates,
      ...(updates.status === "completed" || updates.status === "failed" || updates.status === "cancelled"
        ? { finished_at: new Date() }
        : {}),
    })
    .where(eq(workflow_runs.id, runId))
    .returning();

  await db.insert(audit_logs).values({
    actor_type: "system",
    actor_id: "workflow-engine",
    action: "workflow_run_updated",
    entity_type: "workflow_run",
    entity_id: runId,
    details_json: updates,
  });

  return run;
}

/**
 * Complete a workflow run.
 */
export async function completeWorkflowRun(runId: string) {
  return updateWorkflowRun(runId, { status: "completed" });
}

/**
 * Fail a workflow run.
 */
export async function failWorkflowRun(runId: string, errorSummary: string) {
  return updateWorkflowRun(runId, { status: "failed", error_summary: errorSummary });
}

/**
 * Get all workflow runs, optionally filtered by status.
 */
export async function getWorkflowRuns(status?: WorkflowRunStatus) {
  if (status) {
    return await db
      .select()
      .from(workflow_runs)
      .where(eq(workflow_runs.status, status))
      .orderBy(workflow_runs.started_at);
  }
  return await db
    .select()
    .from(workflow_runs)
    .orderBy(workflow_runs.started_at);
}
