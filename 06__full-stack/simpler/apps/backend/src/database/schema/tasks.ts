import { pgTable, uuid, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users'; // Path to your users table

export const statusEnum = pgEnum('task_status', [
  'TODO',
  'IN_PROGRESS',
  'DONE',
]);
export const priorityEnum = pgEnum('task_priority', ['LOW', 'MEDIUM', 'HIGH']);

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: statusEnum('status').default('TODO').notNull(),
  priority: priorityEnum('priority').default('MEDIUM').notNull(),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TaskSelect = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
