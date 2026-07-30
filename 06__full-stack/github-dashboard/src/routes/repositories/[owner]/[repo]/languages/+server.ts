import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepositoryByPath, getRepositoryLanguages } from '$lib/db/services';

/**
 * GET /repositories/[owner]/[repo]/languages
 * Returns the languages breakdown in bytes.
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
		const languages = await getRepositoryLanguages(repo.id);
		return json({ languages });
	} catch (error: any) {
		console.error('Failed to get repository languages:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
