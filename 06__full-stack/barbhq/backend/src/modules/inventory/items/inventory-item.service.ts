import { inventoryItemRepository, InventoryItemRepository } from './inventory-item.repository';
import { stockMovementRepository, StockMovementRepository } from '../movements/stock-movement.repository';
import type { CreateItemDto, UpdateItemDto, AdjustStockDto, ConsumptionDto } from './inventory-item.validator';
import type { IInventoryItem } from '../../../models/inventory-item.model';
import type { IStockMovement } from '../../../models/stock-movement.model';
import { StockMovementType } from '../../../models/stock-movement.model';
import { auditLogService, AuditLogService } from '../../audit-logs/audit-log.service';
import { User } from '../../../models/user.model';
import { notificationService } from '../../notifications/notification.service';
import { NotificationType } from '../../../models/notification.model';

export class InventoryItemService {
  constructor(
    private itemRepo: InventoryItemRepository = inventoryItemRepository,
    private movementRepo: StockMovementRepository = stockMovementRepository,
    private auditLog: AuditLogService = auditLogService,
  ) {}

  async getItems(
    shopId: string,
    options: { categoryId?: string; includeInactive?: boolean; isSellable?: boolean } = {},
  ): Promise<IInventoryItem[]> {
    return this.itemRepo.findByShop(shopId, options);
  }

  async getItemById(id: string, shopId: string): Promise<IInventoryItem> {
    const item = await this.itemRepo.findById(id, shopId);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }
    return item;
  }

  async createItem(shopId: string, actorId: string, dto: CreateItemDto): Promise<IInventoryItem> {
    const duplicate = await this.itemRepo.findBySku(shopId, dto.sku);
    if (duplicate) {
      throw new ApiError(400, `An item with SKU "${dto.sku.toUpperCase()}" already exists in this shop`);
    }

    const item = await this.itemRepo.create(shopId, actorId, dto);

    // Record initial stock movement if initial quantity > 0
    if (item.currentQuantity > 0) {
      await this.movementRepo.create({
        shopId,
        inventoryItemId: item._id.toString(),
        type: StockMovementType.ADJUSTMENT_IN,
        quantity: item.currentQuantity,
        unitCost: item.averageCost,
        previousQuantity: 0,
        newQuantity: item.currentQuantity,
        reason: 'Initial stock setup',
        createdBy: actorId,
      });
    }

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Create Inventory Item',
      entity: 'InventoryItem',
      entityId: item._id.toString(),
      newValue: item.toJSON(),
    });

    return item;
  }

  async updateItem(
    id: string,
    shopId: string,
    actorId: string,
    dto: UpdateItemDto,
  ): Promise<IInventoryItem> {
    const item = await this.itemRepo.findById(id, shopId);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    if (dto.sku && dto.sku.toUpperCase() !== item.sku.toUpperCase()) {
      const duplicate = await this.itemRepo.findBySku(shopId, dto.sku);
      if (duplicate) {
        throw new ApiError(400, `An item with SKU "${dto.sku.toUpperCase()}" already exists in this shop`);
      }
    }

    const updated = await this.itemRepo.update(id, shopId, dto);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Update Inventory Item',
      entity: 'InventoryItem',
      entityId: id,
      oldValue: item.toJSON(),
      newValue: updated?.toJSON(),
    });

    return updated!;
  }

  async adjustStock(
    id: string,
    shopId: string,
    actorId: string,
    dto: AdjustStockDto,
  ): Promise<{ item: IInventoryItem; movement: IStockMovement }> {
    const item = await this.itemRepo.findById(id, shopId);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    const previousQuantity = item.currentQuantity;
    const newQuantity = dto.quantity;
    const delta = newQuantity - previousQuantity;

    if (delta === 0) {
      throw new ApiError(400, 'Target quantity matches current quantity; no adjustment needed');
    }

    const movementType = delta > 0 ? StockMovementType.ADJUSTMENT_IN : StockMovementType.ADJUSTMENT_OUT;

    const movement = await this.movementRepo.create({
      shopId,
      inventoryItemId: item._id.toString(),
      type: movementType,
      quantity: delta,
      unitCost: item.averageCost,
      previousQuantity,
      newQuantity,
      reason: dto.reason,
      createdBy: actorId,
    });

    const updatedItem = (await this.itemRepo.updateQuantityAndCost(id, shopId, newQuantity))!;

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Adjust Stock Level',
      entity: 'InventoryItem',
      entityId: id,
      oldValue: { currentQuantity: previousQuantity },
      newValue: { currentQuantity: newQuantity, reason: dto.reason },
    });

    return { item: updatedItem, movement };
  }

  async recordConsumption(
    shopId: string,
    actorId: string,
    dto: ConsumptionDto,
  ): Promise<{ item: IInventoryItem; movement: IStockMovement }> {
    const item = await this.itemRepo.findById(dto.inventoryItemId, shopId);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    if (item.currentQuantity < dto.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock: current stock is ${item.currentQuantity} ${item.unit}, attempted to consume ${dto.quantity} ${item.unit}`,
      );
    }

    const previousQuantity = item.currentQuantity;
    const newQuantity = previousQuantity - dto.quantity;

    const movement = await this.movementRepo.create({
      shopId,
      inventoryItemId: item._id.toString(),
      type: StockMovementType.CONSUMPTION,
      quantity: -dto.quantity,
      unitCost: item.averageCost,
      previousQuantity,
      newQuantity,
      reason: dto.reason || 'Daily shop usage',
      createdBy: actorId,
    });

    const updatedItem = (await this.itemRepo.updateQuantityAndCost(item._id.toString(), shopId, newQuantity))!;

    this.checkAndTriggerStockAlerts(updatedItem).catch((err) =>
      console.error('[Notification Trigger Error]', err),
    );

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Record Stock Consumption',
      entity: 'InventoryItem',
      entityId: item._id.toString(),
      oldValue: { currentQuantity: previousQuantity },
      newValue: { currentQuantity: newQuantity, consumed: dto.quantity, reason: dto.reason },
    });

    return { item: updatedItem, movement };
  }

  private async checkAndTriggerStockAlerts(item: IInventoryItem): Promise<void> {
    const shopId = item.shopId.toString();
    const managers = await User.find({ shopId, role: { $in: ['OWNER', 'MANAGER'] }, isActive: true });
    if (managers.length === 0) return;

    const recipientIds = managers.map((m) => m._id.toString());

    if (item.currentQuantity === 0) {
      await notificationService.publish({
        shopId,
        type: NotificationType.OUT_OF_STOCK,
        recipientIds,
        data: {
          itemName: item.name,
          quantity: item.currentQuantity,
          unit: item.unit,
        },
      });
    } else if (item.currentQuantity <= item.minimumQuantity) {
      await notificationService.publish({
        shopId,
        type: NotificationType.LOW_STOCK,
        recipientIds,
        data: {
          itemName: item.name,
          quantity: item.currentQuantity,
          unit: item.unit,
        },
      });
    }
  }

  async getItemMovements(id: string, shopId: string): Promise<IStockMovement[]> {
    const item = await this.itemRepo.findById(id, shopId);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }
    return this.movementRepo.findByItem(shopId, id);
  }

  async deleteItem(id: string, shopId: string, actorId: string): Promise<void> {
    const item = await this.itemRepo.findById(id, shopId);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    await this.itemRepo.delete(id, shopId);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Delete Inventory Item',
      entity: 'InventoryItem',
      entityId: id,
      oldValue: item.toJSON(),
    });
  }
}

export const inventoryItemService = new InventoryItemService();
