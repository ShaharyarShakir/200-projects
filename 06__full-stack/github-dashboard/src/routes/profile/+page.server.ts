import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOctokitClient } from '$lib/github/client';
import { getStreakStats } from '$lib/db/services';

/**
 * Server loader for /profile page.
 * Retrieves OAuth token, makes GitHub API calls for profile stats & organizations,
 * and fetches cached contribution calendar / streaks from database.
 */
export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}

	const userId = event.locals.user.id;

	// Query account table for GitHub access token
	const account = await db
		.select({ accessToken: accounts.accessToken })
		.from(accounts)
		.where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'github')))
		.limit(1)
		.then((res) => res[0]);

	if (!account || !account.accessToken) {
		return {
			user: event.locals.user,
			githubProfile: null,
			streakStats: null
		};
	}

	try {
		const octokit = getOctokitClient(account.accessToken);

		// Query profile details
		const ghProfile = await octokit.rest.users.getAuthenticated();

		// Query organizations with scope error fallback
		let organizations: { name: string; avatarUrl: string; description: string }[] = [];
		try {
			const orgs = await octokit.rest.orgs.listForAuthenticatedUser();
			organizations = orgs.data.map((o) => ({
				name: o.login,
				avatarUrl: o.avatar_url,
				description: o.description || ''
			}));
		} catch (orgError) {
			console.warn('Failed to list GitHub organizations due to scope limits:', orgError);
		}

		// Load streak statistics from local database
		const streakStats = await getStreakStats(userId);

		return {
			user: event.locals.user,
			githubProfile: {
				avatarUrl: ghProfile.data.avatar_url,
				followers: ghProfile.data.followers,
				following: ghProfile.data.following,
				publicRepos: ghProfile.data.public_repos,
				createdAt: ghProfile.data.created_at,
				organizations
			},
			streakStats
		};
	} catch (error: any) {
		console.error('Failed to load user profile statistics:', error);

		// Fallback if GitHub API or database query fails
		const streakStats = await getStreakStats(userId).catch(() => null);

		return {
			user: event.locals.user,
			githubProfile: null,
			streakStats
		};
	}
};
