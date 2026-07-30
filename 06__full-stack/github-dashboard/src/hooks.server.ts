import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Skip auth handling during build time
	if (building) {
		return resolve(event);
	}

	// Retrieve the session from headers and attach it to SvelteKit event.locals
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const path = event.url.pathname;

	// List of protected routes that require authentication
	const protectedRoutes = [
		'/dashboard',
		'/repositories',
		'/issues',
		'/pull-requests',
		'/analytics',
		'/profile',
		'/settings'
	];

	const isProtectedRoute = protectedRoutes.some(
		(route) => path === route || path.startsWith(route + '/')
	);

	// Redirect unauthenticated users trying to access protected routes to login page
	if (isProtectedRoute && !event.locals.user) {
		throw redirect(302, '/login');
	}

	// Redirect authenticated users trying to access login page to dashboard
	if (path === '/login' && event.locals.user) {
		throw redirect(302, '/dashboard');
	}

	// Delegate processing to the Better Auth SvelteKit handler
	return svelteKitHandler({ event, resolve, auth, building });
};
