import { pgTable, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { repositories } from './repositories';

export const repositoryCommits = pgTable('repository_commits', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	repositoryId: integer('repository_id')
		.notNull()
		.references(() => repositories.id, { onDelete: 'cascade' }),
	sha: varchar('sha', { length: 100 }).notNull(),
	author: varchar('author', { length: 255 }).notNull(),
	avatarUrl: text('avatar_url'),
	message: text('message').notNull(),
	commitDate: timestamp('commit_date').notNull(),
	branch: varchar('branch', { length: 255 }).notNull()
});
