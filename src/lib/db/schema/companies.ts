import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organization_id: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    website: varchar("website", { length: 500 }),
    industry: varchar("industry", { length: 100 }),
    location: varchar("location", { length: 255 }),
    size_band: varchar("size_band", { length: 50 }), // 1-10, 11-50, 51-200, 201-500, 501+
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("companies_org_idx").on(table.organization_id),
    nameIdx: index("companies_name_idx").on(table.name),
  })
);
