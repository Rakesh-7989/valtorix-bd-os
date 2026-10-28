import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { profiles } from "./profiles";
import { roles } from "./roles";

export const organization_members = pgTable("organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  profile_id: uuid("profile_id")
    .references(() => profiles.id)
    .notNull(),
  role_id: uuid("role_id").references(() => roles.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
