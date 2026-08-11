import type { Request, Response } from 'express';
import { shopService, ShopService } from './shop.service';
import { ShopMapper } from './shop.mapper';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class ShopController {
  constructor(private service: ShopService = shopService) {}

  getCurrentShop = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const shop = await this.service.getShopById(shopId);
    sendResponse(res, 200, ShopMapper.toDto(shop), 'Shop profile retrieved successfully');
  });

  updateCurrentShop = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const shop = await this.service.updateShop(shopId, req.body);
    sendResponse(res, 200, ShopMapper.toDto(shop), 'Shop profile updated successfully');
  });
}

export const shopController = new ShopController();
