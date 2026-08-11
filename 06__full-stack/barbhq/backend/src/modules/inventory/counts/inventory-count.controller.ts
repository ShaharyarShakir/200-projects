import type { Request, Response } from 'express';
import { inventoryCountService, InventoryCountService } from './inventory-count.service';
import { sendResponse } from '../../../utils/ApiResponse';
import { asyncHandler } from '../../../utils/asyncHandler';
import { InventoryCountStatus } from '../../../models/inventory-count.model';

export class InventoryCountController {
  constructor(private service: InventoryCountService = inventoryCountService) {}

  getInventoryCounts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const status = req.query.status as InventoryCountStatus | undefined;
    const counts = await this.service.getInventoryCounts(shopId, status);
    sendResponse(res, 200, counts, 'Inventory count sessions retrieved successfully');
  });

  getInventoryCountById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const count = await this.service.getInventoryCountById(id as string, shopId);
    sendResponse(res, 200, count, 'Inventory count session retrieved successfully');
  });

  startInventoryCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const count = await this.service.startInventoryCount(shopId, actorId, req.body);
    sendResponse(res, 201, count, 'Inventory count session started successfully');
  });

  recordCountItems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const updated = await this.service.recordCountItems(id as string, shopId, actorId, req.body);
    sendResponse(res, 200, updated, 'Inventory count items recorded successfully');
  });

  completeInventoryCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const completed = await this.service.completeInventoryCount(id as string, shopId, actorId);
    sendResponse(res, 200, completed, 'Inventory count session completed successfully');
  });
}

export const inventoryCountController = new InventoryCountController();
