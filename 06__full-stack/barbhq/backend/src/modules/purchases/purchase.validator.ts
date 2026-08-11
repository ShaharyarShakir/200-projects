import { z } from 'zod';
import { PurchaseStatus } from '../../models/purchase-order.model';

const purchaseOrderItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory Item ID is required'),
  quantityOrdered: z.number().min(1, 'Quantity ordered must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  discount: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier (Vendor) ID is required'),
  purchaseNumber: z.string().optional(),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
  tax: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  status: z.enum([PurchaseStatus.DRAFT, PurchaseStatus.ORDERED]).optional().default(PurchaseStatus.DRAFT),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

const receiveItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory Item ID is required'),
  quantityReceived: z.number().min(0, 'Received quantity cannot be negative'),
});

export const receivePurchaseSchema = z.object({
  items: z.array(receiveItemSchema).min(1, 'At least one item receiving quantity must be specified'),
});

export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderDto = z.infer<typeof updatePurchaseOrderSchema>;
export type ReceivePurchaseDto = z.infer<typeof receivePurchaseSchema>;
