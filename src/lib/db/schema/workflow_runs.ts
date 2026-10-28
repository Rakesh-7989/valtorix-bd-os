import { pgTable, uuid, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

export const workflow_runs = pgTable(
  "workflow_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflow_id: uuid("workflow_id")
      .references(() => workflows.id)
      .notNull(),
    status: varchar("status", { length: 50 }).notNull().default("running"), // running, completed, failed, cancelled, waiting_for_approval
    trigger_payload_json: jsonb("trigger_payload_json"),
    current_state_json: jsonb("current_state_json"),
    error_summary: varchar("error_summary", { length: 1000 }),
    started_at: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finished_at: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => ({
    workflowIdx: index("workflow_runs_workflow_idx").on(table.workflow_id),
    statusIdx: index("workflow_runs_status_idx").on(table.status),
  })
);
