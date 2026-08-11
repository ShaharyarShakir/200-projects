import { purchaseRepository, PurchaseRepository } from './purchase.repository';
import { vendorRepository, VendorRepository } from '../inventory/vendors/vendor.repository';
import { inventoryItemRepository, InventoryItemRepository } from '../inventory/items/inventory-item.repository';
import { stockMovementRepository, StockMovementRepository } from '../inventory/movements/stock-movement.repository';
import type { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, ReceivePurchaseDto } from './purchase.validator';
import type { IPurchaseOrder } from '../../models/purchase-order.model';
import { PurchaseStatus } from '../../models/purchase-order.model';
import { StockMovementType } from '../../models/stock-movement.model';
import { Payable, PayableStatus } from '../../models/payable.model';
import { ApiError } from '../../utils/ApiError';
import { auditLogService, AuditLogService } from '../audit-logs/audit-log.service';

export class PurchaseService {
  constructor(
    private purchaseRepo: PurchaseRepository = purchaseRepository,
    private vendorRepo: VendorRepository = vendorRepository,
    private itemRepo: InventoryItemRepository = inventoryItemRepository,
    private movementRepo: StockMovementRepository = stockMovementRepository,
    private auditLog: AuditLogService = auditLogService,
  ) {}

  async generatePurchaseNumber(shopId: string): Promise<string> {
    const count = await this.purchaseRepo.countByShop(shopId);
    const year = new Date().getFullYear();
    const nextSeq = (count + 1).toString().padStart(4, '0');
    return `PO-${year}-${nextSeq}`;
  }

  async getPurchaseOrders(shopId: string, status?: PurchaseStatus): Promise<IPurchaseOrder[]> {
    return this.purchaseRepo.findByShop(shopId, status);
  }

  async getPurchaseOrderById(id: string, shopId: string): Promise<IPurchaseOrder> {
    const po = await this.purchaseRepo.findById(id, shopId);
    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }
    return po;
  }

  async createPurchaseOrder(
    shopId: string,
    actorId: string,
    dto: CreatePurchaseOrderDto,
  ): Promise<IPurchaseOrder> {
    const vendor = await this.vendorRepo.findById(dto.supplierId, shopId);
    if (!vendor) {
      throw new ApiError(400, 'Supplier (Vendor) not found');
    }

    const purchaseNumber = dto.purchaseNumber
      ? dto.purchaseNumber.trim().toUpperCase()
      : await this.generatePurchaseNumber(shopId);

    const existingPo = await this.purchaseRepo.findByNumber(shopId, purchaseNumber);
    if (existingPo) {
      throw new ApiError(400, `Purchase Order number "${purchaseNumber}" already exists`);
    }

    // Process and validate items
    let subtotal = 0;
    const processedItems = [];

    for (const itemDto of dto.items) {
      const item = await this.itemRepo.findById(itemDto.inventoryItemId, shopId);
      if (!item) {
        throw new ApiError(400, `Inventory item not found: ${itemDto.inventoryItemId}`);
      }

      const discount = itemDto.discount || 0;
      const tax = itemDto.tax || 0;
      const lineTotal = itemDto.quantityOrdered * itemDto.unitCost - discount + tax;

      subtotal += lineTotal;
      processedItems.push({
        inventoryItemId: item._id,
        quantityOrdered: itemDto.quantityOrdered,
        quantityReceived: 0,
        unitCost: itemDto.unitCost,
        discount,
        tax,
        total: Math.max(0, lineTotal),
      });
    }

    const orderTax = dto.tax || 0;
    const orderDiscount = dto.discount || 0;
    const grandTotal = Math.max(0, subtotal + orderTax - orderDiscount);

    const po = await this.purchaseRepo.create({
      shopId: shopId as any,
      supplierId: dto.supplierId as any,
      purchaseNumber,
      status: dto.status || PurchaseStatus.DRAFT,
      orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      items: processedItems as any,
      subtotal,
      tax: orderTax,
      discount: orderDiscount,
      total: grandTotal,
      notes: dto.notes || '',
      createdBy: actorId as any,
    });

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Create Purchase Order',
      entity: 'PurchaseOrder',
      entityId: po._id.toString(),
      newValue: po.toJSON(),
    });

    return po;
  }

  async updatePurchaseOrder(
    id: string,
    shopId: string,
    actorId: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<IPurchaseOrder> {
    const po = await this.purchaseRepo.findById(id, shopId);
    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status !== PurchaseStatus.DRAFT) {
      throw new ApiError(400, `Cannot update purchase order in "${po.status}" state. Only DRAFT orders can be modified.`);
    }

    const updateData: Record<string, any> = {};
    if (dto.expectedDate !== undefined) updateData.expectedDate = dto.expectedDate ? new Date(dto.expectedDate) : undefined;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.status !== undefined) updateData.status = dto.status;

    if (dto.items) {
      let subtotal = 0;
      const processedItems = [];

      for (const itemDto of dto.items) {
        const item = await this.itemRepo.findById(itemDto.inventoryItemId, shopId);
        if (!item) {
          throw new ApiError(400, `Inventory item not found: ${itemDto.inventoryItemId}`);
        }

        const discount = itemDto.discount || 0;
        const tax = itemDto.tax || 0;
        const lineTotal = itemDto.quantityOrdered * itemDto.unitCost - discount + tax;

        subtotal += lineTotal;
        processedItems.push({
          inventoryItemId: item._id,
          quantityOrdered: itemDto.quantityOrdered,
          quantityReceived: 0,
          unitCost: itemDto.unitCost,
          discount,
          tax,
          total: Math.max(0, lineTotal),
        });
      }

      const orderTax = dto.tax !== undefined ? dto.tax : po.tax;
      const orderDiscount = dto.discount !== undefined ? dto.discount : po.discount;

      updateData.items = processedItems;
      updateData.subtotal = subtotal;
      updateData.tax = orderTax;
      updateData.discount = orderDiscount;
      updateData.total = Math.max(0, subtotal + orderTax - orderDiscount);
    }

    const updated = await this.purchaseRepo.update(id, shopId, updateData);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Update Purchase Order',
      entity: 'PurchaseOrder',
      entityId: id,
      oldValue: po.toJSON(),
      newValue: updated?.toJSON(),
    });

    return updated!;
  }

  async receivePurchaseOrder(
    id: string,
    shopId: string,
    actorId: string,
    dto: ReceivePurchaseDto,
  ): Promise<IPurchaseOrder> {
    const po = await this.purchaseRepo.findById(id, shopId);
    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status === PurchaseStatus.CANCELLED) {
      throw new ApiError(400, 'Cannot receive items for a CANCELLED purchase order');
    }

    if (po.status === PurchaseStatus.RECEIVED) {
      throw new ApiError(400, 'Purchase order has already been fully RECEIVED');
    }

    let newlyReceivedValue = 0;
    const updatedItems = po.items.map((item: any) => {
      const plain = item.toObject ? item.toObject() : item;
      const itemIdStr =
        typeof plain.inventoryItemId === 'object' && plain.inventoryItemId
          ? plain.inventoryItemId._id || plain.inventoryItemId.id || plain.inventoryItemId.toString()
          : plain.inventoryItemId;
      return {
        _id: plain._id || plain.id,
        inventoryItemId: itemIdStr,
        quantityOrdered: plain.quantityOrdered,
        quantityReceived: plain.quantityReceived,
        unitCost: plain.unitCost,
        discount: plain.discount || 0,
        tax: plain.tax || 0,
        total: plain.total || 0,
      };
    });

    for (const recDto of dto.items) {
      const itemIndex = updatedItems.findIndex((i: any) => {
        const id1 =
          typeof i.inventoryItemId === 'object' && i.inventoryItemId
            ? i.inventoryItemId._id || i.inventoryItemId.id || i.inventoryItemId
            : i.inventoryItemId;
        return String(id1) === String(recDto.inventoryItemId);
      });

      if (itemIndex === -1) {
        throw new ApiError(400, `Item ${recDto.inventoryItemId} is not part of this purchase order`);
      }

      const poItem = updatedItems[itemIndex];
      const maxReceivable = poItem.quantityOrdered - poItem.quantityReceived;

      if (recDto.quantityReceived > maxReceivable) {
        throw new ApiError(
          400,
          `Cannot over-receive item. Ordered: ${poItem.quantityOrdered}, Already received: ${poItem.quantityReceived}, Attempted to receive: ${recDto.quantityReceived}`,
        );
      }

      if (recDto.quantityReceived > 0) {
        const delta = recDto.quantityReceived;
        poItem.quantityReceived += delta;

        // Fetch Inventory Item to update stock & WAC
        const invItem = await this.itemRepo.findById(recDto.inventoryItemId, shopId);
        if (!invItem) {
          throw new ApiError(404, `Inventory item not found: ${recDto.inventoryItemId}`);
        }

        const previousQuantity = invItem.currentQuantity;
        const newQuantity = previousQuantity + delta;

        // Calculate Weighted Average Cost (WAC)
        // formula: ((previousQuantity * previousWac) + (delta * unitCost)) / newQuantity
        const currentTotalCost = previousQuantity * invItem.averageCost;
        const addedTotalCost = delta * poItem.unitCost;
        const newAverageCost = newQuantity > 0 ? (currentTotalCost + addedTotalCost) / newQuantity : poItem.unitCost;

        // Create Stock Movement (PURCHASE)
        await this.movementRepo.create({
          shopId,
          inventoryItemId: invItem._id.toString(),
          type: StockMovementType.PURCHASE,
          quantity: delta,
          unitCost: poItem.unitCost,
          previousQuantity,
          newQuantity,
          referenceType: 'PURCHASE_ORDER',
          referenceId: po._id.toString(),
          reason: `Purchase Order ${po.purchaseNumber} receipt`,
          createdBy: actorId,
        });

        // Update item stock & average cost
        await this.itemRepo.updateQuantityAndCost(invItem._id.toString(), shopId, newQuantity, newAverageCost);

        newlyReceivedValue += delta * poItem.unitCost;
      }
    }

    // Determine new status
    const allFullyReceived = updatedItems.every((i: any) => i.quantityReceived >= i.quantityOrdered);
    const anyReceived = updatedItems.some((i: any) => i.quantityReceived > 0);

    const newStatus = allFullyReceived
      ? PurchaseStatus.RECEIVED
      : anyReceived
      ? PurchaseStatus.PARTIALLY_RECEIVED
      : po.status;

    const updatedPo = await this.purchaseRepo.updateStatusAndItems(id, shopId, newStatus, updatedItems);

    // Create or update Vendor Financial Payable if value received > 0
    if (newlyReceivedValue > 0) {
      const supplierIdStr =
        typeof po.supplierId === 'object'
          ? (po.supplierId as any).id || (po.supplierId as any)._id
          : po.supplierId.toString();

      let payable = await Payable.findOne({ shopId, purchaseOrderId: po._id });
      if (!payable) {
        payable = await Payable.create({
          shopId,
          supplierId: supplierIdStr,
          purchaseOrderId: po._id,
          amount: newlyReceivedValue,
          paidAmount: 0,
          status: PayableStatus.UNPAID,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 net days
        });
      } else {
        payable.amount += newlyReceivedValue;
        if (payable.status === PayableStatus.PAID && payable.amount > payable.paidAmount) {
          payable.status = PayableStatus.PARTIALLY_PAID;
        }
        await payable.save();
      }
    }

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Receive Purchase Order',
      entity: 'PurchaseOrder',
      entityId: id,
      oldValue: { status: po.status },
      newValue: { status: newStatus, receivedValue: newlyReceivedValue },
    });

    return updatedPo!;
  }

  async cancelPurchaseOrder(id: string, shopId: string, actorId: string): Promise<IPurchaseOrder> {
    const po = await this.purchaseRepo.findById(id, shopId);
    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status === PurchaseStatus.RECEIVED) {
      throw new ApiError(400, 'Cannot cancel a fully RECEIVED purchase order');
    }

    if (po.status === PurchaseStatus.PARTIALLY_RECEIVED) {
      throw new ApiError(400, 'Cannot cancel a PARTIALLY_RECEIVED purchase order');
    }

    const updated = await this.purchaseRepo.update(id, shopId, { status: PurchaseStatus.CANCELLED });

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Cancel Purchase Order',
      entity: 'PurchaseOrder',
      entityId: id,
      oldValue: { status: po.status },
      newValue: { status: PurchaseStatus.CANCELLED },
    });

    return updated!;
  }
}

export const purchaseService = new PurchaseService();
