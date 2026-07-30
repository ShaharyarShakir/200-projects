import { getRepositories } from '$lib/db/repositories';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Redirect unauthenticated users
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}

	// Fetch repositories for the authenticated user
	const repositories = await getRepositories(event.locals.user.id);
	return {
		repositories
	};
};
