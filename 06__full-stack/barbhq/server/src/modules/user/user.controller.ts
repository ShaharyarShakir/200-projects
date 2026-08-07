import type { Request, Response } from 'express';
import { UserService } from './user.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

const userService = new UserService();

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const users = await userService.getAllUsersByShop(req.user.shopId);
  sendResponse(res, 200, users, 'Users retrieved successfully');
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const user = await userService.getUserById(req.params.id as string, req.user.shopId);
  sendResponse(res, 200, user, 'User retrieved successfully');
});
