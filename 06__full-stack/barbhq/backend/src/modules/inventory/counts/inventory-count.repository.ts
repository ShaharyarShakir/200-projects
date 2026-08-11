import { InventoryCount, type IInventoryCount, InventoryCountStatus } from '../../../models/inventory-count.model';

export class InventoryCountRepository {
  async findByShop(shopId: string, status?: InventoryCountStatus): Promise<IInventoryCount[]> {
    const query: Record<string, any> = { shopId };
    if (status) query.status = status;

    return InventoryCount.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('items.inventoryItemId', 'name sku unit averageCost')
      .sort({ createdAt: -1 });
  }

  async findById(id: string, shopId: string): Promise<IInventoryCount | null> {
    return InventoryCount.findOne({ _id: id, shopId })
      .populate('createdBy', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('items.inventoryItemId', 'name sku unit averageCost');
  }

  async findActiveCount(shopId: string): Promise<IInventoryCount | null> {
    return InventoryCount.findOne({ shopId, status: InventoryCountStatus.IN_PROGRESS });
  }

  async create(data: Partial<IInventoryCount>): Promise<IInventoryCount> {
    return InventoryCount.create(data);
  }

  async update(id: string, shopId: string, data: Partial<IInventoryCount>): Promise<IInventoryCount | null> {
    return InventoryCount.findOneAndUpdate(
      { _id: id, shopId },
      { $set: data },
      { returnDocument: 'after' },
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('items.inventoryItemId', 'name sku unit averageCost');
  }
}

export const inventoryCountRepository = new InventoryCountRepository();
