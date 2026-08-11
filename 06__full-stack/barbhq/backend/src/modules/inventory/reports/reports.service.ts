import { inventoryItemRepository, InventoryItemRepository } from '../items/inventory-item.repository';
import { stockMovementRepository, StockMovementRepository } from '../movements/stock-movement.repository';
import type { IStockMovement } from '../../../models/stock-movement.model';

export interface ValuationReport {
  totalItems: number;
  totalQuantity: number;
  totalValuation: number;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    itemCount: number;
    totalQuantity: number;
    valuation: number;
  }>;
  items: Array<{
    itemId: string;
    sku: string;
    name: string;
    unit: string;
    currentQuantity: number;
    averageCost: number;
    totalValue: number;
  }>;
}

export interface InventoryAlerts {
  lowStock: Array<{
    itemId: string;
    sku: string;
    name: string;
    unit: string;
    currentQuantity: number;
    minimumQuantity: number;
    reorderQuantity: number;
  }>;
  outOfStock: Array<{
    itemId: string;
    sku: string;
    name: string;
    unit: string;
    currentQuantity: number;
    minimumQuantity: number;
    reorderQuantity: number;
  }>;
}

export class ReportsService {
  constructor(
    private itemRepo: InventoryItemRepository = inventoryItemRepository,
    private movementRepo: StockMovementRepository = stockMovementRepository,
  ) {}

  async getValuationReport(shopId: string): Promise<ValuationReport> {
    const items = await this.itemRepo.findByShop(shopId, { includeInactive: false });

    let totalQuantity = 0;
    let totalValuation = 0;
    const categoryMap = new Map<string, { categoryId: string; categoryName: string; itemCount: number; totalQuantity: number; valuation: number }>();

    const itemDetails = items.map((item) => {
      const qty = item.currentQuantity;
      const avgCost = item.averageCost;
      const lineValue = Math.round(qty * avgCost * 100) / 100;

      totalQuantity += qty;
      totalValuation += lineValue;

      const categoryObj = typeof item.categoryId === 'object' ? (item.categoryId as any) : null;
      const catId = categoryObj ? categoryObj.id || categoryObj._id.toString() : item.categoryId.toString();
      const catName = categoryObj ? categoryObj.name : 'Uncategorized';

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          categoryName: catName,
          itemCount: 0,
          totalQuantity: 0,
          valuation: 0,
        });
      }

      const catGroup = categoryMap.get(catId)!;
      catGroup.itemCount += 1;
      catGroup.totalQuantity += qty;
      catGroup.valuation = Math.round((catGroup.valuation + lineValue) * 100) / 100;

      return {
        itemId: item._id.toString(),
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        currentQuantity: qty,
        averageCost: avgCost,
        totalValue: lineValue,
      };
    });

    return {
      totalItems: items.length,
      totalQuantity,
      totalValuation: Math.round(totalValuation * 100) / 100,
      categories: Array.from(categoryMap.values()),
      items: itemDetails,
    };
  }

  async getInventoryAlerts(shopId: string): Promise<InventoryAlerts> {
    const items = await this.itemRepo.findByShop(shopId, { includeInactive: false });

    const lowStock: InventoryAlerts['lowStock'] = [];
    const outOfStock: InventoryAlerts['outOfStock'] = [];

    for (const item of items) {
      if (item.currentQuantity <= 0) {
        outOfStock.push({
          itemId: item._id.toString(),
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          currentQuantity: item.currentQuantity,
          minimumQuantity: item.minimumQuantity,
          reorderQuantity: item.reorderQuantity,
        });
      } else if (item.currentQuantity <= item.minimumQuantity) {
        lowStock.push({
          itemId: item._id.toString(),
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          currentQuantity: item.currentQuantity,
          minimumQuantity: item.minimumQuantity,
          reorderQuantity: item.reorderQuantity,
        });
      }
    }

    return { lowStock, outOfStock };
  }

  async getMovementsReport(shopId: string, limit = 100): Promise<IStockMovement[]> {
    return this.movementRepo.findByShop(shopId, limit);
  }
}

export const reportsService = new ReportsService();
