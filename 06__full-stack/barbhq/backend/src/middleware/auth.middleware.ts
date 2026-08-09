import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/token';
import { UserRole, User } from '../models/user.model';
import { Shop } from '../models/shop.model';

export interface AuthenticatedUser {
  id: string;
  shopId: string;
  role: UserRole | string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Authentication token missing');
    }

    const decoded = verifyAccessToken(token);

    const userId = decoded.id || (decoded as Record<string, unknown>).userId;
    const shopId = decoded.shopId;

    if (!userId || !shopId) {
      throw new ApiError(401, 'Invalid authentication token payload');
    }

    // Verify user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account is inactive or no longer exists');
    }

    // Verify shop exists and is active
    const shop = await Shop.findById(shopId);
    if (!shop || !shop.isActive) {
      throw new ApiError(403, 'Shop tenant is inactive or suspended');
    }

    req.user = {
      id: user._id.toString(),
      shopId: user.shopId.toString(),
      role: user.role,
      email: user.email,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, 'Invalid or expired authentication token'));
    }
  }
};

export const authorize = (...allowedRoles: (UserRole | string)[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'User not authenticated'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient permissions'));
    }

    next();
  };
};
