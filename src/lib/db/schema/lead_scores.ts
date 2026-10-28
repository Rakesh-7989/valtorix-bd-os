import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { leads } from "./leads";

export const lead_scores = pgTable("lead_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  lead_id: uuid("lead_id")
    .references(() => leads.id)
    .notNull(),
  score_version: varchar("score_version", { length: 50 }).notNull(),
  score: integer("score").notNull(),
  reasoning_json: varchar("reasoning_json", { length: 5000 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
