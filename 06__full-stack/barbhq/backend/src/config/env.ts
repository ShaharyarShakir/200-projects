import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/barbersaas'),
  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be at least 8 characters long').default('super_secret_access_token_key_change_me'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters long').default('super_secret_refresh_token_key_change_me'),
});

const envParse = envSchema.safeParse({
  ...process.env,
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/barbersaas',
});

if (!envParse.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(envParse.error.flatten(), null, 2));
  process.exit(1);
}

export const env = envParse.data;
