import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { notebook } from "./notebook.js";

export const note = pgTable("note", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  notebookId: uuid("notebook_id").references(() => notebook.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  content: jsonb("content"),
  summary: text("summary"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
