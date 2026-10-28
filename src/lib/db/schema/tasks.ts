import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { deals } from "./deals";
import { profiles } from "./profiles";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization_id: uuid("organization_id").notNull(),
    lead_id: uuid("lead_id").references(() => leads.id),
    deal_id: uuid("deal_id").references(() => deals.id),
    owner_id: uuid("owner_id")
      .references(() => profiles.id)
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    due_at: timestamp("due_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, completed, cancelled
    idempotency_key: varchar("idempotency_key", { length: 255 }).unique(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("tasks_org_idx").on(table.organization_id),
    leadIdx: index("tasks_lead_idx").on(table.lead_id),
    dealIdx: index("tasks_deal_idx").on(table.deal_id),
    ownerIdx: index("tasks_owner_idx").on(table.owner_id),
    dueIdx: index("tasks_due_idx").on(table.due_at),
    statusIdx: index("tasks_status_idx").on(table.status),
    idempotencyIdx: index("tasks_idempotency_idx").on(table.idempotency_key),
  })
);
