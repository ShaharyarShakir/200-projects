import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = (event) => {
	// If the user is already logged in, redirect them to the dashboard
	if (event.locals.user) {
		throw redirect(302, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const provider = formData.get('provider')?.toString() ?? 'github';
		const callbackURL = '/dashboard';

		try {
			// Trigger social sign in with Better Auth
			const result = await auth.api.signInSocial({
				body: {
					provider: provider as 'github',
					callbackURL
				}
			});

			// If Better Auth returns a redirect URL, redirect the user
			if (result && result.url) {
				throw redirect(302, result.url);
			}
		} catch (error) {
			// Re-throw SvelteKit's internal redirect response
			if (isRedirect(error)) {
				throw error;
			}
			console.error('GitHub OAuth initialization failed:', error);
			return fail(400, {
				message: 'Authentication failed. Please check your credentials or try again later.'
			});
		}

		return fail(400, { message: 'Authentication failed. Could not determine authorization URL.' });
	}
};
