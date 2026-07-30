import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepositoryByPath, getRepositoryCommits } from '$lib/db/services';

/**
 * GET /repositories/[owner]/[repo]/commits
 * Returns the commits for the repository, supporting optional pagination.
 */
export const GET: RequestHandler = async ({ params, locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized: Access denied. Please log in first.' }, { status: 401 });
	}

	const repo = await getRepositoryByPath(params.owner, params.repo, locals.user.id);
	if (!repo) {
		return json({ error: 'Repository not found.' }, { status: 404 });
	}

	const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '100')));
	const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

	try {
		const commits = await getRepositoryCommits(repo.id, limit, offset);
		return json({ commits });
	} catch (error: any) {
		console.error('Failed to get repository commits:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
