import { pgTable, uuid, varchar, timestamp, jsonb, index, integer } from "drizzle-orm/pg-core";
import { workflow_runs } from "./workflow_runs";

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflow_run_id: uuid("workflow_run_id")
      .references(() => workflow_runs.id)
      .notNull(),
    job_type: varchar("job_type", { length: 50 }).notNull(), // research, score, draft, approve, send_email, create_task
    payload_json: jsonb("payload_json").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, running, completed, failed, dead_letter
    attempt_count: integer("attempt_count").default(0).notNull(),
    max_attempts: integer("max_attempts").default(3).notNull(),
    next_run_at: timestamp("next_run_at", { withTimezone: true }).notNull(),
    idempotency_key: varchar("idempotency_key", { length: 255 }).unique(),
    error_message: varchar("error_message", { length: 1000 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completed_at: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    runIdx: index("jobs_run_idx").on(table.workflow_run_id),
    typeIdx: index("jobs_type_idx").on(table.job_type),
    statusIdx: index("jobs_status_idx").on(table.status),
    nextRunIdx: index("jobs_next_run_idx").on(table.next_run_at),
    idempotencyIdx: index("jobs_idempotency_idx").on(table.idempotency_key),
  })
);
