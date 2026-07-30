import { db } from './connection';
import { repositories } from './schema';
import { eq, and, ilike, desc, notInArray, or, sql } from 'drizzle-orm';
import type { Repository } from '$lib/types';

export type InsertRepository = typeof repositories.$inferInsert;

/**
 * Retrieves repositories from the database for a specific user with optional search and filters.
 * Sorted by updated_at DESC.
 */
export async function getRepositories(
	userId: string,
	filters?: { search?: string; owner?: string; language?: string }
): Promise<Repository[]> {
	const conditions = [eq(repositories.userId, userId)];

	if (filters?.search) {
		const searchPattern = `%${filters.search}%`;
		const searchCond = or(
			ilike(repositories.name, searchPattern),
			ilike(repositories.language, searchPattern),
			sql`exists (
				select 1 from repository_contributors 
				where repository_contributors.repository_id = ${repositories.id} 
				and repository_contributors.username ilike ${searchPattern}
			)`,
			sql`exists (
				select 1 from repository_topics 
				where repository_topics.repository_id = ${repositories.id} 
				and repository_topics.topic ilike ${searchPattern}
			)`
		);
		if (searchCond) {
			conditions.push(searchCond);
		}
	}
	if (filters?.owner) {
		conditions.push(eq(repositories.owner, filters.owner));
	}
	if (filters?.language) {
		conditions.push(eq(repositories.language, filters.language));
	}

	const results = await db
		.select()
		.from(repositories)
		.where(and(...conditions))
		.orderBy(desc(repositories.updatedAt));

	return results as Repository[];
}

/**
 * Retrieves all unique language names for a user's repositories (useful for filter dropdowns).
 */
export async function getUniqueLanguages(userId: string): Promise<string[]> {
	const results = await db
		.select({ language: repositories.language })
		.from(repositories)
		.where(eq(repositories.userId, userId));

	const languages = new Set<string>();
	for (const row of results) {
		if (row.language) {
			languages.add(row.language);
		}
	}
	return Array.from(languages).sort();
}

/**
 * Retrieves all unique owners/organizations for a user's repositories (useful for filter dropdowns).
 */
export async function getUniqueOwners(userId: string): Promise<string[]> {
	const results = await db
		.select({ owner: repositories.owner })
		.from(repositories)
		.where(eq(repositories.userId, userId));

	const owners = new Set<string>();
	for (const row of results) {
		if (row.owner) {
			owners.add(row.owner);
		}
	}
	return Array.from(owners).sort();
}

/**
 * Inserts a repository or updates its columns if it already exists (upsert based on github_id).
 */
export async function upsertRepository(data: InsertRepository): Promise<Repository> {
	const results = await db
		.insert(repositories)
		.values(data)
		.onConflictDoUpdate({
			target: repositories.githubId,
			set: {
				owner: data.owner,
				ownerAvatar: data.ownerAvatar,
				name: data.name,
				fullName: data.fullName,
				private: data.private,
				visibility: data.visibility,
				defaultBranch: data.defaultBranch,
				description: data.description,
				language: data.language,
				license: data.license,
				homepage: data.homepage,
				stars: data.stars,
				watchers: data.watchers,
				forks: data.forks,
				openIssues: data.openIssues,
				size: data.size,
				archived: data.archived,
				disabled: data.disabled,
				hasIssues: data.hasIssues,
				hasProjects: data.hasProjects,
				hasWiki: data.hasWiki,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
				pushedAt: data.pushedAt,
				syncedAt: data.syncedAt,
				userId: data.userId
			}
		})
		.returning();

	return results[0] as Repository;
}

/**
 * Deletes repositories from local database for a user that are not in the provided active GitHub IDs.
 * Used to clean up repositories that the user deleted or lost access to on GitHub.
 */
export async function deleteRemovedRepositories(
	userId: string,
	activeGithubIds: bigint[]
): Promise<void> {
	if (activeGithubIds.length === 0) {
		await db.delete(repositories).where(eq(repositories.userId, userId));
		return;
	}

	await db
		.delete(repositories)
		.where(
			and(eq(repositories.userId, userId), notInArray(repositories.githubId, activeGithubIds))
		);
}

/**
 * Retrieves a single repository by its auto-incremented database ID.
 */
export async function getRepository(id: number): Promise<Repository | null> {
	const results = await db.select().from(repositories).where(eq(repositories.id, id)).limit(1);
	if (results.length === 0) {
		return null;
	}
	return results[0] as Repository;
}
