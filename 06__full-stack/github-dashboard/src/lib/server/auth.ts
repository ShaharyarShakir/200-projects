import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as schema from './db/schema';

export const auth = betterAuth({
	// Set base URL from the environment variable (fallback to localhost:5173)
	baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
	secret: env.BETTER_AUTH_SECRET,

	// Better Auth database adapter using Drizzle with explicit schema mappings
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verification
		}
	}),

	// Define additional user schema fields
	user: {
		additionalFields: {
			username: {
				type: 'string',
				required: false
			}
		}
	},

	// Enable GitHub OAuth provider
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID || '',
			clientSecret: env.GITHUB_CLIENT_SECRET || '',
			scope: ['read:user', 'user:email', 'read:org'],
			// Map GitHub profile data to user schema, specifically storing GitHub login as username
			mapProfileToUser: async (profile) => {
				return {
					name: profile.name || profile.login,
					email: profile.email,
					image: profile.avatar_url,
					username: profile.login
				};
			}
		}
	},

	// SvelteKit cookies helper plugin
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
