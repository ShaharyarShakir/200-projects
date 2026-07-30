import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { repositories, repositoryCommits } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getRepositories } from '$lib/db/repositories';

/**
 * Server loader for /analytics
 * Retrieves user's repositories and aggregates synced commits across all repos to drive analytics.
 */
export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}

	const userId = event.locals.user.id;

	try {
		// Load repositories
		const repos = await getRepositories(userId);

		// Load commits across all user repositories
		const commits = await db
			.select({
				id: repositoryCommits.id,
				sha: repositoryCommits.sha,
				commitDate: repositoryCommits.commitDate,
				repositoryId: repositoryCommits.repositoryId,
				repoName: repositories.name
			})
			.from(repositoryCommits)
			.innerJoin(repositories, eq(repositoryCommits.repositoryId, repositories.id))
			.where(eq(repositories.userId, userId))
			.orderBy(desc(repositoryCommits.commitDate));

		return {
			repositories: repos,
			commits
		};
	} catch (error) {
		console.error('Failed to load analytics loader data:', error);
		return {
			repositories: [],
			commits: []
		};
	}
};
