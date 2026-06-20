import { createMiddleware } from 'hono/factory';
import { verifyToken } from '../utils/jwt.utils';
import type { User } from '@bms/shared';

// Extend Hono context to include user
type Variables = {
  user: User;
};

export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    c.set('user', payload as User);
    await next();
  }
);
