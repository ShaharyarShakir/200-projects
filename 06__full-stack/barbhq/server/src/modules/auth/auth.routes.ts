import { Router } from 'express';
import { registerOwner, login, logout, refresh, getMe, changePassword } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { registerSchema, loginSchema, refreshSchema, changePasswordSchema } from './auth.validator';

export const authRouter = Router();

// Public routes
authRouter.post('/auth/register', validate(registerSchema), registerOwner);
authRouter.post('/auth/login', validate(loginSchema), login);
authRouter.post('/auth/refresh', validate(refreshSchema), refresh);

// Protected routes
authRouter.post('/auth/logout', authenticate, validate(refreshSchema), logout);
authRouter.get('/auth/me', authenticate, getMe);
authRouter.patch(
  '/auth/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);
