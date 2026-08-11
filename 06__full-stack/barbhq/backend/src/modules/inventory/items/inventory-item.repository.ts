import { InventoryItem, type IInventoryItem } from '../../../models/inventory-item.model';
import type { CreateItemDto, UpdateItemDto } from './inventory-item.validator';

export class InventoryItemRepository {
  async findByShop(
    shopId: string,
    options: { categoryId?: string; includeInactive?: boolean; isSellable?: boolean } = {},
  ): Promise<IInventoryItem[]> {
    const query: Record<string, any> = { shopId };
    if (!options.includeInactive) query.isActive = true;
    if (options.categoryId) query.categoryId = options.categoryId;
    if (options.isSellable !== undefined) query.isSellable = options.isSellable;

    return InventoryItem.find(query)
      .populate('categoryId', 'name')
      .populate('supplierId', 'name contactName')
      .sort({ name: 1 });
  }

  async findById(id: string, shopId: string): Promise<IInventoryItem | null> {
    return InventoryItem.findOne({ _id: id, shopId })
      .populate('categoryId', 'name')
      .populate('supplierId', 'name contactName');
  }

  async findBySku(shopId: string, sku: string): Promise<IInventoryItem | null> {
    return InventoryItem.findOne({ shopId, sku: sku.trim().toUpperCase() });
  }

  async create(shopId: string, actorId: string, dto: CreateItemDto): Promise<IInventoryItem> {
    return InventoryItem.create({
      shopId,
      sku: dto.sku.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description || '',
      categoryId: dto.categoryId,
      unit: dto.unit,
      currentQuantity: dto.currentQuantity ?? 0,
      minimumQuantity: dto.minimumQuantity ?? 0,
      reorderQuantity: dto.reorderQuantity ?? 0,
      averageCost: dto.averageCost ?? 0,
      sellingPrice: dto.sellingPrice,
      supplierId: dto.supplierId ? dto.supplierId : undefined,
      trackStock: dto.trackStock ?? true,
      isSellable: dto.isSellable ?? false,
      createdBy: actorId,
    });
  }

  async update(id: string, shopId: string, dto: UpdateItemDto): Promise<IInventoryItem | null> {
    const updateData: Record<string, any> = {};
    if (dto.sku !== undefined) updateData.sku = dto.sku.trim().toUpperCase();
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.minimumQuantity !== undefined) updateData.minimumQuantity = dto.minimumQuantity;
    if (dto.reorderQuantity !== undefined) updateData.reorderQuantity = dto.reorderQuantity;
    if (dto.sellingPrice !== undefined) updateData.sellingPrice = dto.sellingPrice;
    if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId ? dto.supplierId : null;
    if (dto.trackStock !== undefined) updateData.trackStock = dto.trackStock;
    if (dto.isSellable !== undefined) updateData.isSellable = dto.isSellable;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return InventoryItem.findOneAndUpdate(
      { _id: id, shopId },
      { $set: updateData },
      { returnDocument: 'after' },
    )
      .populate('categoryId', 'name')
      .populate('supplierId', 'name contactName');
  }

  async updateQuantityAndCost(
    id: string,
    shopId: string,
    newQuantity: number,
    newAverageCost?: number,
  ): Promise<IInventoryItem | null> {
    const updateData: Record<string, any> = { currentQuantity: newQuantity };
    if (newAverageCost !== undefined) {
      updateData.averageCost = Math.round(newAverageCost * 100) / 100;
    }

    return InventoryItem.findOneAndUpdate(
      { _id: id, shopId },
      { $set: updateData },
      { returnDocument: 'after' },
    );
  }

  async delete(id: string, shopId: string): Promise<boolean> {
    const result = await InventoryItem.deleteOne({ _id: id, shopId });
    return result.deletedCount > 0;
  }
}

export const inventoryItemRepository = new InventoryItemRepository();
