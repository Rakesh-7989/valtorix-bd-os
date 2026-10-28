import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { contacts } from "./contacts";
import { profiles } from "./profiles";

export const outreach_drafts = pgTable("outreach_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  lead_id: uuid("lead_id")
    .references(() => leads.id)
    .notNull(),
  contact_id: uuid("contact_id").references(() => contacts.id),
  provider: varchar("provider", { length: 50 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  service_recommended: varchar("service_recommended", { length: 255 }),
  personalization_json: varchar("personalization_json", { length: 5000 }),
  source_context: text("source_context"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  approved_by: uuid("approved_by").references(() => profiles.id),
  approved_at: timestamp("approved_at", { withTimezone: true }),
  sent_at: timestamp("sent_at", { withTimezone: true }),
});
