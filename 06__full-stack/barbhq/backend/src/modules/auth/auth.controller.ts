import type { Request, Response } from 'express';
import { authService, AuthService } from './auth.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.register(req.body);
    sendResponse(res, 201, result, 'Shop owner registered successfully');
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.login(req.body);
    sendResponse(res, 200, result, 'Logged in successfully');
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.service.logout(userId);
    sendResponse(res, 200, null, 'Logged out successfully');
  });

  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tokens = await this.service.refreshToken(req.body);
    sendResponse(res, 200, tokens, 'Tokens refreshed successfully');
  });

  getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const data = await this.service.getMe(userId);
    sendResponse(res, 200, data, 'Authenticated user information retrieved');
  });

  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.service.changePassword(userId, req.body);
    sendResponse(res, 200, null, 'Password changed successfully');
  });
}

export const authController = new AuthController();
