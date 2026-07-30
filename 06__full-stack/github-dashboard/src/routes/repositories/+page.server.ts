import { getRepositories, getUniqueLanguages, getUniqueOwners } from '$lib/db/repositories';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Secure route (fallback safety check)
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}

	const userId = event.locals.user.id;

	// Extract query parameter filters
	const search = event.url.searchParams.get('search') || undefined;
	const owner = event.url.searchParams.get('owner') || undefined;
	const language = event.url.searchParams.get('language') || undefined;

	// Fetch filtered repositories and unique filter tags
	const [repositories, languages, owners] = await Promise.all([
		getRepositories(userId, { search, owner, language }),
		getUniqueLanguages(userId),
		getUniqueOwners(userId)
	]);

	return {
		repositories,
		languages,
		owners,
		filters: {
			search: search || '',
			owner: owner || '',
			language: language || ''
		}
	};
};
