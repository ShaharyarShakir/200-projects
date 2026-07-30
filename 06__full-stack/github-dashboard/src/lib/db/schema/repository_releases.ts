import { pgTable, integer, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { repositories } from './repositories';

export const repositoryReleases = pgTable('repository_releases', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	repositoryId: integer('repository_id')
		.notNull()
		.references(() => repositories.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 255 }),
	tagName: varchar('tag_name', { length: 255 }).notNull(),
	publishedAt: timestamp('published_at'),
	isDraft: boolean('is_draft').notNull().default(false),
	isPrerelease: boolean('is_prerelease').notNull().default(false),
	body: text('body')
});
