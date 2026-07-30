import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const isNeon = env.DATABASE_URL.includes('neon.tech');

let dbClient: any;

if (isNeon) {
	const { drizzle } = await import('drizzle-orm/neon-http');
	const { neon } = await import('@neondatabase/serverless');
	const databaseUrl = env.DATABASE_URL.replace('&channel_binding=require', '').replace('?channel_binding=require', '');
	const client = neon(databaseUrl);
	dbClient = drizzle(client, { schema });
} else {
	const { drizzle } = await import('drizzle-orm/postgres-js');
	const { default: postgres } = await import('postgres');
	const client = postgres(env.DATABASE_URL);
	dbClient = drizzle(client, { schema });
}

export const db = dbClient;

