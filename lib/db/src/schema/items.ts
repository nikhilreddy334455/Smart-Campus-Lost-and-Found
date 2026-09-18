import { createInsertSchema } from "drizzle-zod";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const itemsTable = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportType: varchar("report_type", { length: 10 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    eventTime: timestamp("event_time", { withTimezone: true }).notNull(),
    contactInfo: varchar("contact_info", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    reportTypeIdx: index("idx_items_report_type").on(table.reportType),
    categoryIdx: index("idx_items_category").on(table.category),
    statusIdx: index("idx_items_status").on(table.status),
    eventTimeIdx: index("idx_items_event_time").on(table.eventTime),
  }),
);

export const itemMatchesTable = pgTable(
  "item_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lostItemId: uuid("lost_item_id")
      .notNull()
      .references(() => itemsTable.id, { onDelete: "cascade" }),
    foundItemId: uuid("found_item_id")
      .notNull()
      .references(() => itemsTable.id, { onDelete: "cascade" }),
    confidenceScore: integer("confidence_score").notNull(),
    explanation: text("explanation").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    itemPairUnique: unique("item_matches_pair_unique").on(
      table.lostItemId,
      table.foundItemId,
    ),
    lostItemIdx: index("idx_matches_lost_id").on(table.lostItemId),
    foundItemIdx: index("idx_matches_found_id").on(table.foundItemId),
  }),
);

export const insertItemSchema = createInsertSchema(itemsTable).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertItemMatchSchema = createInsertSchema(itemMatchesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
export type ItemMatch = typeof itemMatchesTable.$inferSelect;