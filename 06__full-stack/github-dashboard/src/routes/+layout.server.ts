import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Expose the user and session from locals to the page store
	return {
		user: event.locals.user || null,
		session: event.locals.session || null
	};
};
