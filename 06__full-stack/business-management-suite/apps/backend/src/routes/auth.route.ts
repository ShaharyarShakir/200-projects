import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { LoginSchema, RegisterSchema } from '@bms/shared';
import { UserModel } from '../models/user.model';
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { authMiddleware } from '../middleware/auth.middleware';

export const authRoutes = new Hono();

// POST /auth/login
authRoutes.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await UserModel.findOne({ email, isActive: true });
  if (!user || !(await user.comparePassword(password))) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const accessToken = signToken({ _id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ _id: user._id });

  return c.json({
    user: user.toJSON(),
    tokens: { accessToken, refreshToken },
  });
});

// POST /auth/register
authRoutes.post('/register', zValidator('json', RegisterSchema), async (c) => {
  const data = c.req.valid('json');

  const exists = await UserModel.findOne({ email: data.email });
  if (exists) return c.json({ error: 'Email already registered' }, 409);

  const user = await UserModel.create(data);
  const accessToken = signToken({ _id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ _id: user._id });

  return c.json({ user: user.toJSON(), tokens: { accessToken, refreshToken } }, 201);
});

// GET /auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const { _id } = c.get('user');
  const user = await UserModel.findById(_id);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ user: user.toJSON() });
});

// POST /auth/refresh
authRoutes.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return c.json({ error: 'Invalid refresh token' }, 401);

  const user = await UserModel.findById(payload._id);
  if (!user) return c.json({ error: 'User not found' }, 404);

  const accessToken = signToken({ _id: user._id, role: user.role });
  return c.json({ accessToken });
});
