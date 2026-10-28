import { pgTable, uuid, varchar, text, timestamp, index, integer } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { contacts } from "./contacts";
import { profiles } from "./profiles";
import { organizations } from "./organizations";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization_id: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    company_id: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    primary_contact_id: uuid("primary_contact_id").references(() => contacts.id),
    owner_id: uuid("owner_id")
      .references(() => profiles.id)
      .notNull(),
    source: varchar("source", { length: 100 }).notNull(), // csv, manual, website, api
    status: varchar("status", { length: 50 }).notNull().default("new"), // new, contacted, qualified, proposal, negotiation, won, lost, nurture
    score: integer("score").default(0),
    score_reasons_json: text("score_reasons_json"),
    next_action_at: timestamp("next_action_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("leads_org_idx").on(table.organization_id),
    companyIdx: index("leads_company_idx").on(table.company_id),
    ownerIdx: index("leads_owner_idx").on(table.owner_id),
    statusIdx: index("leads_status_idx").on(table.status),
    nextActionIdx: index("leads_next_action_idx").on(table.next_action_at),
  })
);
