import { pgTable, uuid, varchar, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { organizations } from "./organizations";

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization_id: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    company_id: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 100 }),
    consent_status: varchar("consent_status", { length: 50 }).default("unknown"), // unknown, granted, denied
    do_not_contact: boolean("do_not_contact").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("contacts_org_idx").on(table.organization_id),
    companyIdx: index("contacts_company_idx").on(table.company_id),
    emailIdx: index("contacts_email_idx").on(table.email),
  })
);
