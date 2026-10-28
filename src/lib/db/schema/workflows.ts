import { pgTable, uuid, varchar, timestamp, jsonb, index, boolean, integer } from "drizzle-orm/pg-core";

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    trigger_type: varchar("trigger_type", { length: 50 }).notNull(), // new_lead, status_change, reply_received, due_task, approval_decision
    definition_json: jsonb("definition_json").notNull(), // Workflow definition (triggers, conditions, actions, wait states)
    enabled: boolean("enabled").default(true).notNull(),
    version: integer("version").default(1).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    triggerIdx: index("workflows_trigger_idx").on(table.trigger_type),
    enabledIdx: index("workflows_enabled_idx").on(table.enabled),
  })
);
