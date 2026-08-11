import { PurchaseOrder, type IPurchaseOrder, PurchaseStatus } from '../../models/purchase-order.model';

export class PurchaseRepository {
  async findByShop(shopId: string, status?: PurchaseStatus): Promise<IPurchaseOrder[]> {
    const query: Record<string, any> = { shopId };
    if (status) query.status = status;

    return PurchaseOrder.find(query)
      .populate('supplierId', 'name contactName email phone')
      .populate('items.inventoryItemId', 'name sku unit averageCost')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async findById(id: string, shopId: string): Promise<IPurchaseOrder | null> {
    return PurchaseOrder.findOne({ _id: id, shopId })
      .populate('supplierId', 'name contactName email phone')
      .populate('items.inventoryItemId', 'name sku unit averageCost currentQuantity')
      .populate('createdBy', 'firstName lastName email');
  }

  async findByNumber(shopId: string, purchaseNumber: string): Promise<IPurchaseOrder | null> {
    return PurchaseOrder.findOne({ shopId, purchaseNumber: purchaseNumber.trim().toUpperCase() });
  }

  async countByShop(shopId: string): Promise<number> {
    return PurchaseOrder.countDocuments({ shopId });
  }

  async create(data: Partial<IPurchaseOrder>): Promise<IPurchaseOrder> {
    return PurchaseOrder.create(data);
  }

  async update(id: string, shopId: string, data: Partial<IPurchaseOrder>): Promise<IPurchaseOrder | null> {
    return PurchaseOrder.findOneAndUpdate(
      { _id: id, shopId },
      { $set: data },
      { returnDocument: 'after' },
    )
      .populate('supplierId', 'name contactName email phone')
      .populate('items.inventoryItemId', 'name sku unit averageCost');
  }

  async updateStatusAndItems(
    id: string,
    shopId: string,
    status: PurchaseStatus,
    items: any[],
  ): Promise<IPurchaseOrder | null> {
    return PurchaseOrder.findOneAndUpdate(
      { _id: id, shopId },
      { $set: { status, items } },
      { returnDocument: 'after' },
    )
      .populate('supplierId', 'name contactName email phone')
      .populate('items.inventoryItemId', 'name sku unit averageCost');
  }
}

export const purchaseRepository = new PurchaseRepository();
