import type { Request, Response } from 'express';
import { shopSettingsService, ShopSettingsService } from './shop-settings.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class ShopSettingsController {
  constructor(private service: ShopSettingsService = shopSettingsService) {}

  getSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const settings = await this.service.getSettingsByShopId(shopId);
    sendResponse(res, 200, settings, 'Shop settings retrieved successfully');
  });

  updateSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const settings = await this.service.updateSettings(shopId, req.body);
    sendResponse(res, 200, settings, 'Shop settings updated successfully');
  });
}

export const shopSettingsController = new ShopSettingsController();
