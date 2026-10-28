import { pgTable, uuid } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { permissions } from "./permissions";

export const role_permissions = pgTable("role_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  role_id: uuid("role_id")
    .references(() => roles.id)
    .notNull(),
  permission_id: uuid("permission_id")
    .references(() => permissions.id)
    .notNull(),
});
