import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema/jobs";
import { audit_logs } from "@/lib/db/schema/audit_logs";
import { eq, and, sql } from "drizzle-orm";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "dead_letter";

export interface CreateJobInput {
  workflowRunId: string;
  jobType: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  maxAttempts?: number;
  nextRunAt?: Date;
}

/**
 * Job Service — manages persistent background jobs with retry and idempotency.
 *
 * Jobs are stored in the database and processed by a worker.
 * No in-memory timers — serverless functions can stop between requests.
 */

export async function createJob(input: CreateJobInput) {
  // Check idempotency — don't create duplicate jobs
  if (input.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.idempotency_key, input.idempotencyKey))
      .limit(1);
    if (existing) {
      return existing;
    }
  }

  const [job] = await db
    .insert(jobs)
    .values({
      workflow_run_id: input.workflowRunId,
      job_type: input.jobType,
      payload_json: input.payload,
      status: "pending",
      attempt_count: 0,
      max_attempts: input.maxAttempts ?? 3,
      next_run_at: input.nextRunAt ?? new Date(),
      idempotency_key: input.idempotencyKey,
    })
    .returning();

  await db.insert(audit_logs).values({
    actor_type: "system",
    actor_id: "workflow-engine",
    action: "job_created",
    entity_type: "job",
    entity_id: job.id,
    details_json: { job_type: input.jobType, idempotency_key: input.idempotencyKey },
  });

  return job;
}

/**
 * Claim the next due pending job for processing.
 * Uses atomic update to prevent concurrent workers from claiming the same job.
 */
export async function claimNextJob(): Promise<typeof jobs.$inferSelect | null> {
  const now = new Date();

  const [job] = await db
    .update(jobs)
    .set({
      status: "running",
      attempt_count: sql`${jobs.attempt_count} + 1`,
    })
    .where(
      and(
        eq(jobs.status, "pending"),
        sql`${jobs.next_run_at} <= ${now}`
      )
    )
    .returning();

  if (!job) {
    return null;
  }

  return job;
}

/**
 * Mark a job as completed.
 */
export async function completeJob(jobId: string, result?: Record<string, unknown>) {
  const [job] = await db
    .update(jobs)
    .set({
      status: "completed",
      completed_at: new Date(),
    })
    .where(eq(jobs.id, jobId))
    .returning();

  await db.insert(audit_logs).values({
    actor_type: "system",
    actor_id: "workflow-engine",
    action: "job_completed",
    entity_type: "job",
    entity_id: jobId,
    details_json: result,
  });

  return job;
}

/**
 * Mark a job as failed. If max attempts reached, move to dead_letter.
 */
export async function failJob(jobId: string, errorMessage: string) {
  const job = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job.length) return null;

  const j = job[0];
  const nextAttempt = Number(j.attempt_count) + 1;

  if (nextAttempt >= j.max_attempts) {
    const [failed] = await db
      .update(jobs)
      .set({
        status: "dead_letter",
        error_message: errorMessage,
        completed_at: new Date(),
      })
      .where(eq(jobs.id, jobId))
      .returning();

    await db.insert(audit_logs).values({
      actor_type: "system",
      actor_id: "workflow-engine",
      action: "job_dead_letter",
      entity_type: "job",
      entity_id: jobId,
      details_json: { error_message: errorMessage, attempts: j.attempt_count },
    });

    return failed;
  }

  // Schedule retry with exponential backoff
  const retryDelay = Math.pow(2, nextAttempt) * 60 * 1000; // 2^attempt minutes
  const nextRunAt = new Date(Date.now() + retryDelay);

  const [retry] = await db
    .update(jobs)
    .set({
      status: "pending",
      error_message: errorMessage,
      next_run_at: nextRunAt,
    })
    .where(eq(jobs.id, jobId))
    .returning();

  await db.insert(audit_logs).values({
    actor_type: "system",
    actor_id: "workflow-engine",
    action: "job_retry_scheduled",
    entity_type: "job",
    entity_id: jobId,
    details_json: { error_message: errorMessage, attempt: nextAttempt, next_run_at: nextRunAt },
  });

  return retry;
}

/**
 * Get all pending jobs due for execution.
 */
export async function getDueJobs() {
  const now = new Date();
  const allPending = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "pending"));

  return allPending.filter((j) => new Date(j.next_run_at) <= now);
}

/**
 * Get jobs for a workflow run.
 */
export async function getJobsForRun(workflowRunId: string) {
  return await db
    .select()
    .from(jobs)
    .where(eq(jobs.workflow_run_id, workflowRunId))
    .orderBy(jobs.created_at);
}
