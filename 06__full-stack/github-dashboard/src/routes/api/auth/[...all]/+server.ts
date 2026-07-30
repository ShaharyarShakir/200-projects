import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// Handle all request methods (GET, POST, OPTIONS, etc.) for Better Auth endpoints
export const fallback: RequestHandler = ({ request }) => {
	return auth.handler(request);
};
