import type { authClient } from '$lib/auth/client.js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: typeof authClient.$Infer.Session.user | null;
			session: typeof authClient.$Infer.Session.session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
