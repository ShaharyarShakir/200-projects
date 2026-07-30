import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// If the user is already authenticated, redirect them to the dashboard
	if (event.locals.user) {
		throw redirect(302, '/dashboard');
	}
	return {};
};
