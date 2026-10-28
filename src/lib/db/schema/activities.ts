import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { deals } from "./deals";
import { profiles } from "./profiles";

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization_id: uuid("organization_id").notNull(),
    lead_id: uuid("lead_id").references(() => leads.id),
    deal_id: uuid("deal_id").references(() => deals.id),
    type: varchar("type", { length: 50 }).notNull(), // call, email, meeting, note, task, outreach
    direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
    subject: varchar("subject", { length: 255 }),
    body: text("body"),
    occurred_at: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    created_by: uuid("created_by")
      .references(() => profiles.id)
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("activities_org_idx").on(table.organization_id),
    leadIdx: index("activities_lead_idx").on(table.lead_id),
    dealIdx: index("activities_deal_idx").on(table.deal_id),
    typeIdx: index("activities_type_idx").on(table.type),
    occurredIdx: index("activities_occurred_idx").on(table.occurred_at),
  })
);
