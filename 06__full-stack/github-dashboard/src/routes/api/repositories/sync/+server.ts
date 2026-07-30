import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncRepositories } from '$lib/github/sync';

/**
 * POST /api/repositories/sync
 * Only authenticated users can call this endpoint to trigger GitHub repository synchronization.
 */
export const POST: RequestHandler = async (event) => {
	// Verify user session exists
	if (!event.locals.user) {
		return json({ error: 'Unauthorized: Access denied. Please log in first.' }, { status: 401 });
	}

	try {
		// Execute repository sync for the current authenticated user
		const count = await syncRepositories(event.locals.user.id);

		return json({
			success: true,
			imported: count
		});
	} catch (error: any) {
		console.error('Failed to sync GitHub repositories:', error);

		// Safely detect rate limits or unauthorized status codes from Octokit/GitHub API
		const status = error.status || 500;
		let errorMessage = 'Synchronization failed. A network or server error occurred.';

		if (status === 401) {
			errorMessage =
				'GitHub OAuth token has expired or is invalid. Please sign out and sign in again.';
		} else if (status === 403 && error.message?.toLowerCase().includes('rate limit')) {
			errorMessage =
				'GitHub API rate limit exceeded. Please wait a few minutes before trying again.';
		} else if (error.message) {
			errorMessage = error.message;
		}

		return json({ error: errorMessage }, { status });
	}
};
