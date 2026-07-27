import { pgTable, integer, bigint, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const repositories = pgTable('repositories', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	githubId: bigint('github_id', { mode: 'bigint' }).unique(),
	name: varchar('name', { length: 255 }).notNull(),
	owner: varchar('owner', { length: 255 }),
	language: varchar('language', { length: 100 }),
	stars: integer('stars'),
	forks: integer('forks'),
	openIssues: integer('open_issues'),
	description: text('description'),
	updatedAt: timestamp('updated_at'),
	createdAt: timestamp('created_at').defaultNow()
});
