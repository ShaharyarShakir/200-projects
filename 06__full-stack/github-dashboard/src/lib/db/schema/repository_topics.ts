import { pgTable, integer, varchar } from 'drizzle-orm/pg-core';
import { repositories } from './repositories';

export const repositoryTopics = pgTable('repository_topics', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	repositoryId: integer('repository_id')
		.notNull()
		.references(() => repositories.id, { onDelete: 'cascade' }),
	topic: varchar('topic', { length: 255 }).notNull()
});
