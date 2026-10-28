import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { contacts } from "./contacts";

export const suppression_records = pgTable(
  "suppression_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lead_id: uuid("lead_id").references(() => leads.id),
    contact_id: uuid("contact_id").references(() => contacts.id),
    channel: varchar("channel", { length: 50 }).notNull().default("email"), // email, linkedin, phone
    normalized_address: varchar("normalized_address", { length: 255 }).notNull().unique(),
    reason: varchar("reason", { length: 100 }).notNull(), // unsubscribe, bounce, opt_out, do_not_contact, invalid
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    created_by: uuid("created_by").notNull(),
  },
  (table) => ({
    channelIdx: index("suppression_records_channel_idx").on(table.channel),
    addressIdx: index("suppression_records_address_idx").on(table.normalized_address),
    leadIdx: index("suppression_records_lead_idx").on(table.lead_id),
    contactIdx: index("suppression_records_contact_idx").on(table.contact_id),
  })
);
