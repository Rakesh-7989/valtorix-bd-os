import { pgTable, uuid, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const audit_logs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actor_type: varchar("actor_type", { length: 50 }).notNull(), // user, ai_agent, system
    actor_id: varchar("actor_id", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(), // lead_created, outreach_sent, deal_approved, etc.
    entity_type: varchar("entity_type", { length: 50 }),
    entity_id: uuid("entity_id"),
    details_json: jsonb("details_json"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actorIdx: index("audit_logs_actor_idx").on(table.actor_type, table.actor_id),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    entityIdx: index("audit_logs_entity_idx").on(table.entity_type, table.entity_id),
    createdIdx: index("audit_logs_created_idx").on(table.created_at),
  })
);
