import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),

  email: text().notNull().unique(),

  passwordHash: text().notNull(),

  createdAt: timestamp().defaultNow().notNull(),
});
