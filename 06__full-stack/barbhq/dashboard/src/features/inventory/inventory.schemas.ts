import { z } from "zod";
import { InventoryUnit } from "./inventory.types";

export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
  name: z.string().min(1, "Product name is required").max(150, "Name too long"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.nativeEnum(InventoryUnit, {
    error: "Valid unit is required",
  }),
  currentQuantity: z.number().min(0, "Current quantity cannot be negative").default(0),
  minimumQuantity: z.number().min(0, "Minimum quantity cannot be negative").default(0),
  reorderQuantity: z.number().min(0, "Reorder quantity cannot be negative").default(0),
  averageCost: z.number().min(0, "Cost per unit cannot be negative").default(0),
  sellingPrice: z.number().min(0, "Selling price cannot be negative").optional(),
  supplierId: z.string().optional(),
  trackStock: z.boolean().default(true),
  isSellable: z.boolean().default(false),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const adjustStockSchema = z.object({
  quantity: z.number().min(0, "Target quantity cannot be negative"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;

export const consumptionSchema = z.object({
  inventoryItemId: z.string().min(1, "Product selection is required"),
  quantity: z.number().positive("Consumed quantity must be greater than 0"),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type ConsumptionFormValues = z.infer<typeof consumptionSchema>;

export const purchaseOrderItemSchema = z.object({
  inventoryItemId: z.string().min(1, "Select product"),
  quantityOrdered: z.number().min(1, "Quantity must be at least 1"),
  unitCost: z.number().min(0, "Unit cost cannot be negative"),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "At least one item is required in the purchase"),
  tax: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(150),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
