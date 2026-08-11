import type { Request, Response } from 'express';
import { shopDashboardService, ShopDashboardService } from './shop-dashboard.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class ShopDashboardController {
  constructor(private service: ShopDashboardService = shopDashboardService) {}

  getDashboardOverview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const overview = await this.service.getDashboardOverview(shopId);
    sendResponse(res, 200, overview, 'Shop dashboard overview retrieved successfully');
  });

  getWorkforceDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const dashboard = await this.service.getWorkforceDashboard(shopId);
    sendResponse(res, 200, dashboard, 'Shop workforce dashboard retrieved successfully');
  });
}

export const shopDashboardController = new ShopDashboardController();
