import type { Request, Response } from 'express';
import { ShopService } from './shop.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

const shopService = new ShopService();

export const getShopProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shop = await shopService.getShopById(req.user.shopId);
  sendResponse(res, 200, shop, 'Shop profile retrieved successfully');
});
