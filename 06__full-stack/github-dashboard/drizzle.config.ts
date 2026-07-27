import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load environment variables for Drizzle CLI runtimes
dotenv.config();

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is missing');
}

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL
	},
	verbose: true,
	strict: true
});
