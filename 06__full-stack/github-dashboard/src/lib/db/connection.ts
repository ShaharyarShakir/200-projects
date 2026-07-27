import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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

const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });
export type DbClient = typeof db;
