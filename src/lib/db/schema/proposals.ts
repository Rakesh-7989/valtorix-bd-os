import { pgTable, uuid, varchar, text, timestamp, index, integer, numeric } from "drizzle-orm/pg-core";
import { deals } from "./deals";
import { profiles } from "./profiles";

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deal_id: uuid("deal_id")
      .references(() => deals.id)
      .notNull(),
    organization_id: uuid("organization_id").notNull(),
    version: integer("version").notNull().default(1),
    status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, sent, approved, rejected, expired
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    tax_amount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    file_path: varchar("file_path", { length: 500 }),
    file_checksum: varchar("file_checksum", { length: 64 }),
    approved_by: uuid("approved_by").references(() => profiles.id),
    approved_at: timestamp("approved_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dealIdx: index("proposals_deal_idx").on(table.deal_id),
    orgIdx: index("proposals_org_idx").on(table.organization_id),
    statusIdx: index("proposals_status_idx").on(table.status),
    versionIdx: index("proposals_version_idx").on(table.deal_id, table.version),
  })
);
