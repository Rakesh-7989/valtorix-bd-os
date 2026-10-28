import { pgTable, uuid, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { workflow_runs } from "./workflow_runs";
import { profiles } from "./profiles";

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflow_run_id: uuid("workflow_run_id")
      .references(() => workflow_runs.id)
      .notNull(),
    action_type: varchar("action_type", { length: 50 }).notNull(), // send_email, create_deal, approve_pricing, approve_terms
    entity_type: varchar("entity_type", { length: 50 }).notNull(), // lead, deal, proposal, outreach_draft
    entity_id: uuid("entity_id").notNull(),
    payload_json: jsonb("payload_json").notNull(), // Exact proposed payload
    payload_hash: varchar("payload_hash", { length: 64 }).notNull(), // SHA-256 of payload for integrity
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected, expired, cancelled
    requested_by: uuid("requested_by")
      .references(() => profiles.id)
      .notNull(),
    reviewed_by: uuid("reviewed_by").references(() => profiles.id),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    runIdx: index("approvals_run_idx").on(table.workflow_run_id),
    actionIdx: index("approvals_action_idx").on(table.action_type),
    statusIdx: index("approvals_status_idx").on(table.status),
    entityIdx: index("approvals_entity_idx").on(table.entity_type, table.entity_id),
    expiresIdx: index("approvals_expires_idx").on(table.expires_at),
  })
);
