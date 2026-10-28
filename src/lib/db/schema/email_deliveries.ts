import { pgTable, uuid, varchar, text, timestamp, index, integer } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { contacts } from "./contacts";
import { outreach_drafts } from "./outreach_drafts";

export const email_deliveries = pgTable(
  "email_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outreach_draft_id: uuid("outreach_draft_id")
      .references(() => outreach_drafts.id)
      .notNull(),
    lead_id: uuid("lead_id")
      .references(() => leads.id)
      .notNull(),
    contact_id: uuid("contact_id")
      .references(() => contacts.id)
      .notNull(),
    approval_id: uuid("approval_id").notNull(),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    provider: varchar("provider", { length: 50 }).notNull(),
    provider_message_id: varchar("provider_message_id", { length: 255 }),
    sent_at: timestamp("sent_at", { withTimezone: true }),
    delivered_at: timestamp("delivered_at", { withTimezone: true }),
    error_message: text("error_message"),
    retry_count: integer("retry_count").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    leadIdx: index("email_deliveries_lead_idx").on(table.lead_id),
    contactIdx: index("email_deliveries_contact_idx").on(table.contact_id),
    statusIdx: index("email_deliveries_status_idx").on(table.status),
    approvalIdx: index("email_deliveries_approval_idx").on(table.approval_id),
  })
);
