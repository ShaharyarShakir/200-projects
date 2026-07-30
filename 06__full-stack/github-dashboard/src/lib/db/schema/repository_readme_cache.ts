import { pgTable, integer, text } from 'drizzle-orm/pg-core';
import { repositories } from './repositories';

export const repositoryReadmeCache = pgTable('repository_readme_cache', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	repositoryId: integer('repository_id')
		.notNull()
		.unique()
		.references(() => repositories.id, { onDelete: 'cascade' }),
	content: text('content').notNull()
});
