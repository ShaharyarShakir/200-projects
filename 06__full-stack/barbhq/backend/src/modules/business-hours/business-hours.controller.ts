import type { Request, Response } from 'express';
import { businessHoursService, BusinessHoursService } from './business-hours.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class BusinessHoursController {
  constructor(private service: BusinessHoursService = businessHoursService) {}

  getHours = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const hours = await this.service.getHoursByShopId(shopId);
    sendResponse(res, 200, hours, 'Business hours retrieved successfully');
  });

  updateHours = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const hours = await this.service.updateHours(shopId, req.body);
    sendResponse(res, 200, hours, 'Business hours updated successfully');
  });
}

export const businessHoursController = new BusinessHoursController();
