import type { Request, Response } from 'express';
import { holidayService, HolidayService } from './holiday.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class HolidayController {
  constructor(private service: HolidayService = holidayService) {}

  getHolidays = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const holidays = await this.service.getHolidaysByShop(shopId);
    sendResponse(res, 200, holidays, 'Shop holidays retrieved successfully');
  });

  createHoliday = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const holiday = await this.service.createHoliday(shopId, req.body);
    sendResponse(res, 201, holiday, 'Holiday created successfully');
  });

  updateHoliday = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const id = req.params.id as string;
    const holiday = await this.service.updateHoliday(id, shopId, req.body);
    sendResponse(res, 200, holiday, 'Holiday updated successfully');
  });

  deleteHoliday = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const id = req.params.id as string;
    await this.service.deleteHoliday(id, shopId);
    sendResponse(res, 200, null, 'Holiday deleted successfully');
  });
}

export const holidayController = new HolidayController();
