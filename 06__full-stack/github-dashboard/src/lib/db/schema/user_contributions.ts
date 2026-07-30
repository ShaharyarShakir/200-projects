import { pgTable, integer, text, date } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userContributions = pgTable('user_contributions', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	date: date('date').notNull(),
	count: integer('count').notNull().default(0)
});
