import { pgTable, uuid, varchar, text, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";

export const followup_rules = pgTable(
  "followup_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    is_active: boolean("is_active").default(true).notNull(),
    sequence_config: jsonb("sequence_config").notNull(),
    stop_conditions: jsonb("stop_conditions").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index("followup_rules_active_idx").on(table.is_active),
  })
);
