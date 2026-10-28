import { pgTable, uuid } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { tags } from "./tags";

export const lead_tags = pgTable("lead_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  lead_id: uuid("lead_id")
    .references(() => leads.id)
    .notNull(),
  tag_id: uuid("tag_id")
    .references(() => tags.id)
    .notNull(),
});
