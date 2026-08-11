import type { Request, Response } from 'express';
import { reportsService, ReportsService } from './reports.service';
import { sendResponse } from '../../../utils/ApiResponse';
import { asyncHandler } from '../../../utils/asyncHandler';

export class ReportsController {
  constructor(private service: ReportsService = reportsService) {}

  getValuationReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const report = await this.service.getValuationReport(shopId);
    sendResponse(res, 200, report, 'Inventory valuation report generated successfully');
  });

  getInventoryAlerts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const alerts = await this.service.getInventoryAlerts(shopId);
    sendResponse(res, 200, alerts, 'Inventory stock alerts retrieved successfully');
  });

  getMovementsReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const movements = await this.service.getMovementsReport(shopId, limit);
    sendResponse(res, 200, movements, 'Inventory stock movements report generated successfully');
  });
}

export const reportsController = new ReportsController();
