import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { meetings } from "./meetings";
import { profiles } from "./profiles";

export const meeting_actions = pgTable(
  "meeting_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meeting_id: uuid("meeting_id")
      .references(() => meetings.id)
      .notNull(),
    description: text("description").notNull(),
    owner_id: uuid("owner_id")
      .references(() => profiles.id)
      .notNull(),
    due_at: timestamp("due_at", { withTimezone: true }),
    status: varchar("status", { length: 50 }).notNull().default("open"), // open, completed, cancelled
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    meetingIdx: index("meeting_actions_meeting_idx").on(table.meeting_id),
    ownerIdx: index("meeting_actions_owner_idx").on(table.owner_id),
    statusIdx: index("meeting_actions_status_idx").on(table.status),
  })
);
