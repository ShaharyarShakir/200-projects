import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepositoryByPath, getRepositoryReadme } from '$lib/db/services';
import { marked } from 'marked';

/**
 * GET /repositories/[owner]/[repo]/readme
 * Returns both raw and parsed HTML format of the cached repository README.md.
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
		const readme = await getRepositoryReadme(repo.id);
		if (!readme) {
			return json({ content: '', html: '' });
		}

		// Parse Markdown to HTML asynchronously using marked
		const html = await marked.parse(readme.content);

		return json({
			content: readme.content,
			html
		});
	} catch (error: any) {
		console.error('Failed to fetch/parse README:', error);
		return json({ error: 'Internal server error.' }, { status: 500 });
	}
};
