import { StockMovement, type IStockMovement, StockMovementType } from '../../../models/stock-movement.model';

export interface CreateStockMovementParams {
  shopId: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  createdBy: string;
}

export class StockMovementRepository {
  async create(params: CreateStockMovementParams): Promise<IStockMovement> {
    return StockMovement.create({
      shopId: params.shopId,
      inventoryItemId: params.inventoryItemId,
      type: params.type,
      quantity: params.quantity,
      unitCost: params.unitCost || 0,
      previousQuantity: params.previousQuantity,
      newQuantity: params.newQuantity,
      referenceType: params.referenceType || '',
      referenceId: params.referenceId ? params.referenceId : undefined,
      reason: params.reason || '',
      createdBy: params.createdBy,
    });
  }

  async findByItem(shopId: string, inventoryItemId: string, limit = 50): Promise<IStockMovement[]> {
    return StockMovement.find({ shopId, inventoryItemId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findByShop(shopId: string, limit = 100): Promise<IStockMovement[]> {
    return StockMovement.find({ shopId })
      .populate('inventoryItemId', 'name sku unit')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const stockMovementRepository = new StockMovementRepository();
