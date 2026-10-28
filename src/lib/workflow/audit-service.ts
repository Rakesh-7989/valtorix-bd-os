import { db } from "@/lib/db/client";
import { audit_logs } from "@/lib/db/schema/audit_logs";
import { eq, and } from "drizzle-orm";

export interface AuditLogInput {
  actorType: string;
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

/**
 * Audit Log Service — append-only audit trail for all system actions.
 *
 * Audit logs are critical for compliance and debugging. They cannot be
 * modified or deleted through normal application operations.
 */

export async function createAuditLog(input: AuditLogInput) {
  const [log] = await db
    .insert(audit_logs)
    .values({
      actor_type: input.actorType,
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      details_json: input.details ?? null,
    })
    .returning();

  return log;
}

/**
 * Get audit logs, optionally filtered by entity or action.
 */
export async function getAuditLogs({
  entityType,
  entityId,
  action,
  limit = 100,
  offset = 0,
}: {
  entityType?: string;
  entityId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions: Array<ReturnType<typeof eq>> = [];

  if (entityType) {
    conditions.push(eq(audit_logs.entity_type, entityType));
  }

  if (entityId) {
    conditions.push(eq(audit_logs.entity_id, entityId));
  }

  if (action) {
    conditions.push(eq(audit_logs.action, action));
  }

  return await db
    .select()
    .from(audit_logs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(audit_logs.created_at)
    .limit(limit)
    .offset(offset);
}
