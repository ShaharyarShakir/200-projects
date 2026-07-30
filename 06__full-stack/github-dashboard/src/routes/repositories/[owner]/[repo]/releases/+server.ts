import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepositoryByPath, getRepositoryReleases } from '$lib/db/services';

/**
 * GET /repositories/[owner]/[repo]/releases
 * Returns the releases for the repository.
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
		const releases = await getRepositoryReleases(repo.id);
		return json({ releases });
	} catch (error: any) {
		console.error('Failed to get repository releases:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
