import { pgTable, integer, varchar, text } from 'drizzle-orm/pg-core';
import { repositories } from './repositories';

export const repositoryContributors = pgTable('repository_contributors', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	repositoryId: integer('repository_id')
		.notNull()
		.references(() => repositories.id, { onDelete: 'cascade' }),
	username: varchar('username', { length: 255 }).notNull(),
	avatarUrl: text('avatar_url'),
	contributions: integer('contributions').notNull().default(0),
	profileLink: text('profile_link')
});
