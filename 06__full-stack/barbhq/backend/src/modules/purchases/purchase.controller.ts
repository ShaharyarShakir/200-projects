import type { Request, Response } from 'express';
import { purchaseService, PurchaseService } from './purchase.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { PurchaseStatus } from '../../models/purchase-order.model';

export class PurchaseController {
  constructor(private service: PurchaseService = purchaseService) {}

  getPurchaseOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const status = req.query.status as PurchaseStatus | undefined;
    const pos = await this.service.getPurchaseOrders(shopId, status);
    sendResponse(res, 200, pos, 'Purchase orders retrieved successfully');
  });

  getPurchaseOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const po = await this.service.getPurchaseOrderById(id as string, shopId);
    sendResponse(res, 200, po, 'Purchase order retrieved successfully');
  });

  createPurchaseOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const po = await this.service.createPurchaseOrder(shopId, actorId, req.body);
    sendResponse(res, 201, po, 'Purchase order created successfully');
  });

  updatePurchaseOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const updated = await this.service.updatePurchaseOrder(id as string, shopId, actorId, req.body);
    sendResponse(res, 200, updated, 'Purchase order updated successfully');
  });

  receivePurchaseOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const updated = await this.service.receivePurchaseOrder(id as string, shopId, actorId, req.body);
    sendResponse(res, 200, updated, 'Purchase order inventory received successfully');
  });

  cancelPurchaseOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const cancelled = await this.service.cancelPurchaseOrder(id as string, shopId, actorId);
    sendResponse(res, 200, cancelled, 'Purchase order cancelled successfully');
  });
}

export const purchaseController = new PurchaseController();
