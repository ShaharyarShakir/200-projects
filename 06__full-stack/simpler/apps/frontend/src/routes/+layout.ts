import { authApi } from '$lib/api/auth';
import { auth } from '$lib/stores/auth.svelte';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ url, fetch }) => {
	const protectedRoutes = ['/dashboard', '/tasks', '/notes'];
	const authRoutes = ['/login', '/register'];

	let currentUser = null;

	try {
		currentUser = await authApi.me(fetch);
		auth.setUser(currentUser);
	} catch {
		auth.setUser(null);
	}

	const isProtected = protectedRoutes.some((path) => url.pathname.startsWith(path));
	const isAuthRoute = authRoutes.includes(url.pathname);

	if (isProtected && !currentUser) {
		throw redirect(307, '/login');
	}

	if (isAuthRoute && currentUser) {
		throw redirect(307, '/dashboard');
	}

	return { user: currentUser };
};
