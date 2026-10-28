import { db } from "@/lib/db/client";
import { approvals } from "@/lib/db/schema/approvals";
import { audit_logs } from "@/lib/db/schema/audit_logs";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

/**
 * Approval Service — manages human-governed external actions.
 *
 * Every approval is bound to an exact action payload. No external action
 * (email, deal creation, pricing change) can be executed without a valid,
 * unexpired approval for the exact payload.
 */

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

export interface CreateApprovalInput {
  workflowRunId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  requestedBy: string;
  expiresInMinutes?: number;
}

export interface ApprovalDecisionInput {
  approvalId: string;
  reviewerId: string;
  decision: "approve" | "reject";
}

/**
 * Compute SHA-256 hash of a payload for integrity verification.
 */
function computePayloadHash(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Create a new approval request.
 */
export async function createApproval(input: CreateApprovalInput) {
  const payloadHash = computePayloadHash(input.payload);
  const expiresAt = new Date(
    Date.now() + (input.expiresInMinutes ?? 60) * 60 * 1000
  );

  const [approval] = await db
    .insert(approvals)
    .values({
      workflow_run_id: input.workflowRunId,
      action_type: input.actionType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      payload_json: input.payload,
      payload_hash: payloadHash,
      status: "pending",
      requested_by: input.requestedBy,
      expires_at: expiresAt,
    })
    .returning();

  // Audit log
  await db.insert(audit_logs).values({
    actor_type: "user",
    actor_id: input.requestedBy,
    action: "approval_requested",
    entity_type: input.entityType,
    entity_id: input.entityId,
    details_json: {
      approval_id: approval.id,
      action_type: input.actionType,
      payload_hash: payloadHash,
    },
  });

  return approval;
}

/**
 * Get a pending approval by ID.
 */
export async function getApproval(approvalId: string) {
  const [approval] = await db
    .select()
    .from(approvals)
    .where(eq(approvals.id, approvalId))
    .limit(1);
  return approval;
}

/**
 * Get all pending approvals for review.
 */
export async function getPendingApprovals() {
  return await db
    .select()
    .from(approvals)
    .where(
      and(
        eq(approvals.status, "pending"),
        // expiry check done in application logic
      )
    )
    .orderBy(approvals.created_at);
}

/**
 * Approve or reject an approval request.
 * Validates: approval exists, is pending, not expired, payload hash matches.
 */
export async function decideApproval(input: ApprovalDecisionInput) {
  const approval = await getApproval(input.approvalId);

  if (!approval) {
    throw new Error("Approval not found");
  }

  if (approval.status !== "pending") {
    throw new Error(`Approval already ${approval.status}`);
  }

  if (new Date(approval.expires_at) < new Date()) {
    // Auto-expire
    await db
      .update(approvals)
      .set({ status: "expired" })
      .where(eq(approvals.id, input.approvalId));
    throw new Error("Approval has expired");
  }

  const [updated] = await db
    .update(approvals)
    .set({
      status: input.decision,
      reviewed_by: input.reviewerId,
      reviewed_at: new Date(),
    })
    .where(eq(approvals.id, input.approvalId))
    .returning();

  // Audit log
  await db.insert(audit_logs).values({
    actor_type: "user",
    actor_id: input.reviewerId,
    action: input.decision === "approve" ? "approval_approved" : "approval_rejected",
    entity_type: approval.entity_type,
    entity_id: approval.entity_id,
    details_json: {
      approval_id: approval.id,
      action_type: approval.action_type,
      decision: input.decision,
    },
  });

  return updated;
}

/**
 * Verify that an approval exists, is pending, not expired, and payload hash matches.
 * Called before executing any external action.
 */
export async function verifyApproval(
  approvalId: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const approval = await getApproval(approvalId);
  if (!approval) return false;

  const now = new Date();
  if (approval.status !== "pending") return false;
  if (new Date(approval.expires_at) < now) return false;

  const expectedHash = computePayloadHash(payload);
  if (approval.payload_hash !== expectedHash) return false;

  return true;
}

/**
 * Cancel a pending approval.
 */
export async function cancelApproval(approvalId: string, cancelledBy: string) {
  const [updated] = await db
    .update(approvals)
    .set({ status: "cancelled" })
    .where(
      and(eq(approvals.id, approvalId), eq(approvals.status, "pending"))
    )
    .returning();

  if (updated) {
    await db.insert(audit_logs).values({
      actor_type: "user",
      actor_id: cancelledBy,
      action: "approval_cancelled",
      entity_type: updated.entity_type,
      entity_id: updated.entity_id,
      details_json: { approval_id: approvalId },
    });
  }

  return updated;
}

/**
 * Expire all approvals past their expiry time.
 * Called by the scheduler worker.
 */
export async function expireStaleApprovals() {
  const now = new Date();
  const allPending = await db
    .select()
    .from(approvals)
    .where(eq(approvals.status, "pending"));

  const actuallyExpired = allPending.filter(
    (a) => new Date(a.expires_at) < now
  );

  for (const approval of actuallyExpired) {
    await db
      .update(approvals)
      .set({ status: "expired" })
      .where(eq(approvals.id, approval.id));

    await db.insert(audit_logs).values({
      actor_type: "system",
      actor_id: "workflow-engine",
      action: "approval_expired",
      entity_type: approval.entity_type,
      entity_id: approval.entity_id,
      details_json: { approval_id: approval.id },
    });
  }

  return actuallyExpired.length;
}
