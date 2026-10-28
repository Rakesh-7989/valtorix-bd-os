import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const research_records = pgTable("research_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  research_json: varchar("research_json", { length: 10000 }).notNull(),
  verified: boolean("verified").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
