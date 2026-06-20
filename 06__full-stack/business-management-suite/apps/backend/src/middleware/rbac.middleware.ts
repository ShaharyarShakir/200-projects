import { createMiddleware } from 'hono/factory';
import { ROLE_PERMISSIONS, type Permission } from '@bms/shared';

export const requirePermission = (permission: Permission) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user');
    const userPermissions = ROLE_PERMISSIONS[user.role] ?? [];

    if (!userPermissions.includes(permission)) {
      return c.json({ error: 'Forbidden: insufficient permissions' }, 403);
    }

    await next();
  });
