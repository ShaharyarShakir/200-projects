import { env } from './env';

const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  debug: '\x1b[90m', // Gray
  success: '\x1b[32m', // Green
};

export const logger = {
  info: (message: string, ...meta: any[]) => {
    console.log(
      `${colors.info}[INFO]${colors.reset} [${new Date().toISOString()}] ${message}`,
      ...meta,
    );
  },
  warn: (message: string, ...meta: any[]) => {
    console.warn(
      `${colors.warn}[WARN]${colors.reset} [${new Date().toISOString()}] ${message}`,
      ...meta,
    );
  },
  error: (message: string, error?: any, ...meta: any[]) => {
    console.error(
      `${colors.error}[ERROR]${colors.reset} [${new Date().toISOString()}] ${message}`,
      error instanceof Error ? error.stack || error.message : error || '',
      ...meta,
    );
  },
  debug: (message: string, ...meta: any[]) => {
    if (env.NODE_ENV !== 'production') {
      console.log(
        `${colors.debug}[DEBUG]${colors.reset} [${new Date().toISOString()}] ${message}`,
        ...meta,
      );
    }
  },
  success: (message: string, ...meta: any[]) => {
    console.log(
      `${colors.success}[SUCCESS]${colors.reset} [${new Date().toISOString()}] ${message}`,
      ...meta,
    );
  },
};
export type Logger = typeof logger;
