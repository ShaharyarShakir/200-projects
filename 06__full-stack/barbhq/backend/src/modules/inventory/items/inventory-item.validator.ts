import { z } from 'zod';
import { InventoryUnit } from '../../../models/inventory-item.model';

export const createItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Item name is required').max(150),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category ID is required'),
  unit: z.nativeEnum(InventoryUnit).default(InventoryUnit.PIECE),
  currentQuantity: z.number().min(0, 'Current quantity cannot be negative').optional().default(0),
  minimumQuantity: z.number().min(0, 'Minimum quantity cannot be negative').optional().default(0),
  reorderQuantity: z.number().min(0, 'Reorder quantity cannot be negative').optional().default(0),
  averageCost: z.number().min(0, 'Average cost cannot be negative').optional().default(0),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative').optional(),
  supplierId: z.string().optional(),
  trackStock: z.boolean().optional().default(true),
  isSellable: z.boolean().optional().default(false),
});

export const updateItemSchema = createItemSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const adjustStockSchema = z.object({
  quantity: z.number().min(0, 'Target physical quantity cannot be negative'),
  reason: z.string().min(1, 'Reason for adjustment is required'),
});

export const consumptionSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory Item ID is required'),
  quantity: z.number().positive('Consumed quantity must be greater than 0'),
  reason: z.string().optional(),
});

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
export type AdjustStockDto = z.infer<typeof adjustStockSchema>;
export type ConsumptionDto = z.infer<typeof consumptionSchema>;
