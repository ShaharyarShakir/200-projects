import { pgTable, integer, bigint, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const repositories = pgTable('repositories', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	githubId: bigint('github_id', { mode: 'bigint' }).unique().notNull(),
	owner: varchar('owner', { length: 255 }),
	ownerAvatar: text('owner_avatar'),
	name: varchar('name', { length: 255 }).notNull(),
	fullName: varchar('full_name', { length: 255 }).notNull(),
	private: boolean('private').default(false),
	visibility: varchar('visibility', { length: 50 }),
	defaultBranch: varchar('default_branch', { length: 100 }),
	description: text('description'),
	language: varchar('language', { length: 100 }),
	license: varchar('license', { length: 255 }),
	homepage: text('homepage'),
	stars: integer('stars').default(0),
	watchers: integer('watchers').default(0),
	forks: integer('forks').default(0),
	openIssues: integer('open_issues').default(0),
	size: integer('size').default(0),
	archived: boolean('archived').default(false),
	disabled: boolean('disabled').default(false),
	hasIssues: boolean('has_issues').default(true),
	hasProjects: boolean('has_projects').default(true),
	hasWiki: boolean('has_wiki').default(true),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at'),
	pushedAt: timestamp('pushed_at'),
	syncedAt: timestamp('synced_at').defaultNow(),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' })
});
