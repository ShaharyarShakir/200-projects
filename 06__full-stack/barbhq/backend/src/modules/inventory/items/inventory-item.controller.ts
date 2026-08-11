import type { Request, Response } from 'express';
import { inventoryItemService, InventoryItemService } from './inventory-item.service';
import { sendResponse } from '../../../utils/ApiResponse';
import { asyncHandler } from '../../../utils/asyncHandler';

export class InventoryItemController {
  constructor(private service: InventoryItemService = inventoryItemService) {}

  getItems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const categoryId = req.query.categoryId as string | undefined;
    const includeInactive = req.query.includeInactive === 'true';
    const isSellable = req.query.isSellable ? req.query.isSellable === 'true' : undefined;

    const items = await this.service.getItems(shopId, { categoryId, includeInactive, isSellable });
    sendResponse(res, 200, items, 'Inventory items retrieved successfully');
  });

  getItemById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const item = await this.service.getItemById(id as string, shopId);
    sendResponse(res, 200, item, 'Inventory item retrieved successfully');
  });

  createItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const item = await this.service.createItem(shopId, actorId, req.body);
    sendResponse(res, 201, item, 'Inventory item created successfully');
  });

  updateItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const updated = await this.service.updateItem(id as string, shopId, actorId, req.body);
    sendResponse(res, 200, updated, 'Inventory item updated successfully');
  });

  adjustStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const result = await this.service.adjustStock(id as string, shopId, actorId, req.body);
    sendResponse(res, 200, result, 'Stock level adjusted successfully');
  });

  recordConsumption = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const result = await this.service.recordConsumption(shopId, actorId, req.body);
    sendResponse(res, 200, result, 'Stock consumption recorded successfully');
  });

  getItemMovements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const movements = await this.service.getItemMovements(id as string, shopId);
    sendResponse(res, 200, movements, 'Item stock movements retrieved successfully');
  });

  deleteItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    await this.service.deleteItem(id as string, shopId, actorId);
    sendResponse(res, 200, null, 'Inventory item deleted successfully');
  });
}

export const inventoryItemController = new InventoryItemController();
