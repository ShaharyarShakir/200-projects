import type { Request, Response } from 'express';
import { userService, UserService } from './user.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class UserController {
  constructor(private service: UserService = userService) {}

  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const users = await this.service.getUsersByShop(shopId);
    sendResponse(res, 200, users, 'Shop users retrieved successfully');
  });

  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const userId = req.params.id as string;
    const user = await this.service.getUserById(userId, shopId);
    sendResponse(res, 200, user, 'User retrieved successfully');
  });

  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const userId = req.params.id as string;
    const updated = await this.service.updateUser(userId, shopId, req.body);
    sendResponse(res, 200, updated, 'User updated successfully');
  });
}

export const userController = new UserController();
