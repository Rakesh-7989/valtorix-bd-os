import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { deals } from "./deals";
import { profiles } from "./profiles";

export const handover_records = pgTable(
  "handover_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deal_id: uuid("deal_id")
      .references(() => deals.id)
      .notNull(),
    organization_id: uuid("organization_id").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, completed
    scope_json: text("scope_json"),
    requirements_json: text("requirements_json"),
    delivery_notes: text("delivery_notes"),
    created_by: uuid("created_by")
      .references(() => profiles.id)
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completed_at: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    dealIdx: index("handover_records_deal_idx").on(table.deal_id),
    orgIdx: index("handover_records_org_idx").on(table.organization_id),
    statusIdx: index("handover_records_status_idx").on(table.status),
  })
);
