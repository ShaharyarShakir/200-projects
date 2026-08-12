import type { Request } from 'express';
import type { AuthenticatedUser } from '../middleware/auth.middleware';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiResponseData<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}
