import { authClient } from '$lib/auth/client.js';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const cookie = event.request.headers.get('cookie') || '';

	try {
		const session = await authClient.getSession({
			fetchOptions: {
				headers: {
					cookie
				}
			}
		});

		event.locals.user = session?.data?.user || null;
		event.locals.session = session?.data?.session || null;
	} catch (error) {
		console.error('Error fetching session in hook:', error);
		event.locals.user = null;
		event.locals.session = null;
	}

	// Protect dashboard routes
	if (event.url.pathname.startsWith('/dashboard')) {
		if (!event.locals.user) {
			throw redirect(303, '/login');
		}
	}

	// Redirect logged-in users away from auth pages
	if (event.url.pathname === '/login' || event.url.pathname === '/register') {
		if (event.locals.user) {
			throw redirect(303, '/dashboard');
		}
	}

	return resolve(event);
};
