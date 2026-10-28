import { pgTable, uuid, varchar, text, timestamp, index, integer } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { companies } from "./companies";
import { profiles } from "./profiles";
import { organizations } from "./organizations";

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization_id: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    lead_id: uuid("lead_id")
      .references(() => leads.id)
      .notNull(),
    company_id: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    owner_id: uuid("owner_id")
      .references(() => profiles.id)
      .notNull(),
    stage: varchar("stage", { length: 50 }).notNull().default("qualification"), // qualification, proposal, negotiation, closed_won, closed_lost
    currency: varchar("currency", { length: 3 }).default("INR").notNull(),
    amount: integer("amount").default(0),
    expected_close_at: timestamp("expected_close_at", { withTimezone: true }),
    lost_reason: text("lost_reason"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("deals_org_idx").on(table.organization_id),
    leadIdx: index("deals_lead_idx").on(table.lead_id),
    ownerIdx: index("deals_owner_idx").on(table.owner_id),
    stageIdx: index("deals_stage_idx").on(table.stage),
  })
);
