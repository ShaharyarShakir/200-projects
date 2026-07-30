import { pgTable, integer, varchar, boolean } from 'drizzle-orm/pg-core';
import { repositories } from './repositories';

export const repositoryBranches = pgTable('repository_branches', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	repositoryId: integer('repository_id')
		.notNull()
		.references(() => repositories.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 255 }).notNull(),
	protected: boolean('protected').notNull().default(false),
	isDefault: boolean('is_default').notNull().default(false),
	lastCommitSha: varchar('last_commit_sha', { length: 100 }).notNull()
});
