import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { deals } from "./deals";
import { profiles } from "./profiles";

export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deal_id: uuid("deal_id")
      .references(() => deals.id)
      .notNull(),
    organization_id: uuid("organization_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    agenda: text("agenda"),
    notes: text("notes"),
    scheduled_at: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    duration_minutes: integer("duration_minutes").default(60).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("scheduled"), // scheduled, completed, cancelled, no_show
    external_event_id: varchar("external_event_id", { length: 255 }),
    created_by: uuid("created_by")
      .references(() => profiles.id)
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dealIdx: index("meetings_deal_idx").on(table.deal_id),
    orgIdx: index("meetings_org_idx").on(table.organization_id),
    statusIdx: index("meetings_status_idx").on(table.status),
    scheduledIdx: index("meetings_scheduled_idx").on(table.scheduled_at),
  })
);

import { integer } from "drizzle-orm/pg-core";
