import { pgTable, uuid, varchar, timestamp, index, integer } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { contacts } from "./contacts";
import { tasks } from "./tasks";
import { followup_rules } from "./followup_rules";

export const followup_tasks = pgTable(
  "followup_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    task_id: uuid("task_id")
      .references(() => tasks.id)
      .notNull(),
    lead_id: uuid("lead_id")
      .references(() => leads.id)
      .notNull(),
    contact_id: uuid("contact_id")
      .references(() => contacts.id)
      .notNull(),
    rule_id: uuid("rule_id").references(() => followup_rules.id),
    sequence_step: integer("sequence_step").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("scheduled"),
    stop_reason: varchar("stop_reason", { length: 100 }),
    sent_at: timestamp("sent_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    leadIdx: index("followup_tasks_lead_idx").on(table.lead_id),
    contactIdx: index("followup_tasks_contact_idx").on(table.contact_id),
    ruleIdx: index("followup_tasks_rule_idx").on(table.rule_id),
    statusIdx: index("followup_tasks_status_idx").on(table.status),
  })
);
