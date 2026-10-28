import { pgTable, uuid, varchar, text, timestamp, index, integer, numeric } from "drizzle-orm/pg-core";
import { proposals } from "./proposals";

export const proposal_items = pgTable(
  "proposal_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposal_id: uuid("proposal_id")
      .references(() => proposals.id)
      .notNull(),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
    unit_price: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    line_total: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    proposalIdx: index("proposal_items_proposal_idx").on(table.proposal_id),
  })
);
