import * as schema from './schema';
import dotenv from 'dotenv';

// Load environment variables if running outside of SvelteKit (e.g. in seed scripts)
if (!process.env.DATABASE_URL) {
	dotenv.config();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not defined in the environment variables');
}

const isNeon = databaseUrl.includes('neon.tech');

let dbClient: any;

if (isNeon) {
	const { drizzle } = await import('drizzle-orm/neon-http');
	const { neon } = await import('@neondatabase/serverless');
	const cleanedUrl = databaseUrl.replace('&channel_binding=require', '').replace('?channel_binding=require', '');
	const client = neon(cleanedUrl);
	dbClient = drizzle(client, { schema });
} else {
	const { drizzle } = await import('drizzle-orm/postgres-js');
	const { default: postgres } = await import('postgres');
	const client = postgres(databaseUrl);
	dbClient = drizzle(client, { schema });
}

export const db = dbClient;
export type DbClient = typeof db;

