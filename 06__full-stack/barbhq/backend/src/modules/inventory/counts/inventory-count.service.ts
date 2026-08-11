import { inventoryCountRepository, InventoryCountRepository } from './inventory-count.repository';
import { inventoryItemRepository, InventoryItemRepository } from '../items/inventory-item.repository';
import { stockMovementRepository, StockMovementRepository } from '../movements/stock-movement.repository';
import type { StartCountDto, SubmitCountItemsDto } from './inventory-count.validator';
import type { IInventoryCount } from '../../../models/inventory-count.model';
import { InventoryCountStatus } from '../../../models/inventory-count.model';
import { StockMovementType } from '../../../models/stock-movement.model';
import { ApiError } from '../../../utils/ApiError';
import { auditLogService, AuditLogService } from '../../audit-logs/audit-log.service';

export class InventoryCountService {
  constructor(
    private countRepo: InventoryCountRepository = inventoryCountRepository,
    private itemRepo: InventoryItemRepository = inventoryItemRepository,
    private movementRepo: StockMovementRepository = stockMovementRepository,
    private auditLog: AuditLogService = auditLogService,
  ) {}

  async getInventoryCounts(shopId: string, status?: InventoryCountStatus): Promise<IInventoryCount[]> {
    return this.countRepo.findByShop(shopId, status);
  }

  async getInventoryCountById(id: string, shopId: string): Promise<IInventoryCount> {
    const count = await this.countRepo.findById(id, shopId);
    if (!count) {
      throw new ApiError(404, 'Inventory count session not found');
    }
    return count;
  }

  async startInventoryCount(
    shopId: string,
    actorId: string,
    _dto: StartCountDto,
  ): Promise<IInventoryCount> {
    const activeCount = await this.countRepo.findActiveCount(shopId);
    if (activeCount) {
      throw new ApiError(
        400,
        `An inventory count session is already IN_PROGRESS (${activeCount._id.toString()}). Complete or cancel it first.`,
      );
    }

    const items = await this.itemRepo.findByShop(shopId, { includeInactive: false });
    if (items.length === 0) {
      throw new ApiError(400, 'No active inventory items found in shop to count');
    }

    const countItems = items.map((item) => ({
      inventoryItemId: item._id,
      systemQuantity: item.currentQuantity,
      countedQuantity: item.currentQuantity,
      difference: 0,
      reason: '',
    }));

    const count = await this.countRepo.create({
      shopId: shopId as any,
      status: InventoryCountStatus.IN_PROGRESS,
      startedAt: new Date(),
      createdBy: actorId as any,
      items: countItems as any,
    });

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Start Inventory Count',
      entity: 'InventoryCount',
      entityId: count._id.toString(),
      newValue: { itemCount: countItems.length },
    });

    return count;
  }

  async recordCountItems(
    id: string,
    shopId: string,
    actorId: string,
    dto: SubmitCountItemsDto,
  ): Promise<IInventoryCount> {
    const count = await this.countRepo.findById(id, shopId);
    if (!count) {
      throw new ApiError(404, 'Inventory count session not found');
    }

    if (count.status !== InventoryCountStatus.IN_PROGRESS) {
      throw new ApiError(400, `Cannot update count items for a session in "${count.status}" status`);
    }

    const updatedItems = count.items.map((item: any) => {
      const plain = item.toObject ? item.toObject() : item;
      const itemIdStr =
        typeof plain.inventoryItemId === 'object' && plain.inventoryItemId
          ? plain.inventoryItemId._id || plain.inventoryItemId.id || plain.inventoryItemId.toString()
          : plain.inventoryItemId;
      return {
        _id: plain._id || plain.id,
        inventoryItemId: itemIdStr,
        systemQuantity: plain.systemQuantity,
        countedQuantity: plain.countedQuantity,
        difference: plain.difference,
        reason: plain.reason || '',
      };
    });

    for (const submitItem of dto.items) {
      const index = updatedItems.findIndex((i: any) => String(i.inventoryItemId) === String(submitItem.inventoryItemId));

      if (index !== -1) {
        updatedItems[index].countedQuantity = submitItem.countedQuantity;
        updatedItems[index].difference = submitItem.countedQuantity - updatedItems[index].systemQuantity;
        if (submitItem.reason !== undefined) {
          updatedItems[index].reason = submitItem.reason;
        }
      }
    }

    const updated = await this.countRepo.update(id, shopId, { items: updatedItems });

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Submit Counted Quantities',
      entity: 'InventoryCount',
      entityId: id,
      newValue: { submittedCount: dto.items.length },
    });

    return updated!;
  }

  async completeInventoryCount(id: string, shopId: string, actorId: string): Promise<IInventoryCount> {
    const count = await this.countRepo.findById(id, shopId);
    if (!count) {
      throw new ApiError(404, 'Inventory count session not found');
    }

    if (count.status !== InventoryCountStatus.IN_PROGRESS) {
      throw new ApiError(400, `Cannot complete inventory count in "${count.status}" status`);
    }

    // Process adjustments for items with variances
    for (const item of count.items) {
      const difference = item.difference;
      if (difference !== 0) {
        const itemIdStr =
          typeof item.inventoryItemId === 'object'
            ? (item.inventoryItemId as any).id || (item.inventoryItemId as any)._id
            : item.inventoryItemId.toString();

        const invItem = await this.itemRepo.findById(itemIdStr, shopId);
        if (invItem) {
          const previousQuantity = invItem.currentQuantity;
          const newQuantity = item.countedQuantity;
          const type = difference > 0 ? StockMovementType.ADJUSTMENT_IN : StockMovementType.ADJUSTMENT_OUT;

          // Create stock movement
          await this.movementRepo.create({
            shopId,
            inventoryItemId: itemIdStr,
            type,
            quantity: difference,
            unitCost: invItem.averageCost,
            previousQuantity,
            newQuantity,
            referenceType: 'STOCK_COUNT',
            referenceId: count._id.toString(),
            reason: item.reason || `Stock audit variance adjustment (${difference > 0 ? '+' : ''}${difference})`,
            createdBy: actorId,
          });

          // Update item quantity
          await this.itemRepo.updateQuantityAndCost(itemIdStr, shopId, newQuantity);
        }
      }
    }

    const updated = await this.countRepo.update(id, shopId, {
      status: InventoryCountStatus.COMPLETED,
      completedAt: new Date(),
      completedBy: actorId as any,
    });

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Complete Inventory Count',
      entity: 'InventoryCount',
      entityId: id,
      oldValue: { status: count.status },
      newValue: { status: InventoryCountStatus.COMPLETED },
    });

    return updated!;
  }
}

export const inventoryCountService = new InventoryCountService();
