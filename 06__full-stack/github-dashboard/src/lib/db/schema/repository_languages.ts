import { pgTable, integer, varchar } from 'drizzle-orm/pg-core';
import { repositories } from './repositories';

export const repositoryLanguages = pgTable('repository_languages', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	repositoryId: integer('repository_id')
		.notNull()
		.references(() => repositories.id, { onDelete: 'cascade' }),
	language: varchar('language', { length: 100 }).notNull(),
	bytes: integer('bytes').notNull().default(0)
});
