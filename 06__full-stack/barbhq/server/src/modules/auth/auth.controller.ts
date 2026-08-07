import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

const authService = new AuthService();

export const registerOwner = asyncHandler(async (req: Request, res: Response) => {
  const {
    shopName,
    shopSlug,
    shopEmail,
    ownerFirstName,
    ownerLastName,
    ownerEmail,
    ownerPassword,
  } = req.body;

  const result = await authService.registerOwner(
    { name: shopName, slug: shopSlug, email: shopEmail },
    {
      firstName: ownerFirstName,
      lastName: ownerLastName,
      email: ownerEmail,
      password: ownerPassword,
    },
  );

  sendResponse(res, 201, result, 'Registration completed successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendResponse(res, 200, result, 'Login successful');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  sendResponse(res, 200, null, 'Logout successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  sendResponse(res, 200, result, 'Token refresh successful');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  sendResponse(res, 200, req.user, 'Current user profile retrieved successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  await authService.changePassword(req.user.id, req.user.shopId, req.body);
  sendResponse(res, 200, null, 'Password updated successfully');
});
