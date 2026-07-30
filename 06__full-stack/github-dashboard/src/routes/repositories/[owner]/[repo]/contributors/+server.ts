import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepositoryByPath, getRepositoryContributors } from '$lib/db/services';

/**
 * GET /repositories/[owner]/[repo]/contributors
 * Returns the list of contributors for the repository.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized: Access denied. Please log in first.' }, { status: 401 });
	}

	const repo = await getRepositoryByPath(params.owner, params.repo, locals.user.id);
	if (!repo) {
		return json({ error: 'Repository not found.' }, { status: 404 });
	}

	try {
		const contributors = await getRepositoryContributors(repo.id);
		return json({ contributors });
	} catch (error: any) {
		console.error('Failed to get repository contributors:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
