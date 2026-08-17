export const InventoryUnit = {
  PIECE: "PIECE",
  BOTTLE: "BOTTLE",
  BOX: "BOX",
  PACK: "PACK",
  LITER: "LITER",
  MILLILITER: "MILLILITER",
  KILOGRAM: "KILOGRAM",
  GRAM: "GRAM",
} as const;

export type InventoryUnit = typeof InventoryUnit[keyof typeof InventoryUnit];

export const INVENTORY_UNITS: { label: string; value: InventoryUnit }[] = [
  { label: "Piece / Item", value: "PIECE" },
  { label: "Bottle", value: "BOTTLE" },
  { label: "Box", value: "BOX" },
  { label: "Pack", value: "PACK" },
  { label: "Liter (L)", value: "LITER" },
  { label: "Milliliter (mL)", value: "MILLILITER" },
  { label: "Kilogram (kg)", value: "KILOGRAM" },
  { label: "Gram (g)", value: "GRAM" },
];

export const INITIAL_CATEGORIES = [
  "Hair Care",
  "Beard Care",
  "Styling",
  "Supplies",
  "Equipment",
  "Chemicals",
  "Retail",
  "Other",
];

export interface InventoryCategory {
  id: string;
  shopId?: string;
  name: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  shopId?: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string | InventoryCategory;
  categoryName?: string;
  unit: InventoryUnit | string;
  currentQuantity: number;
  minimumQuantity: number;
  reorderQuantity?: number;
  averageCost: number;
  sellingPrice?: number;
  supplierId?: string | Vendor;
  supplierName?: string;
  trackStock: boolean;
  isSellable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vendor {
  id: string;
  shopId?: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  totalPurchases?: number;
  isActive?: boolean;
  createdAt?: string;
}

export const PurchaseStatus = {
  DRAFT: "DRAFT",
  ORDERED: "ORDERED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
} as const;

export type PurchaseStatus = typeof PurchaseStatus[keyof typeof PurchaseStatus];

export interface PurchaseOrderItem {
  inventoryItemId: string;
  itemName?: string;
  itemSku?: string;
  quantityOrdered: number;
  quantityReceived?: number;
  unitCost: number;
  discount?: number;
  tax?: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  shopId?: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName?: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  status: PurchaseStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export const StockMovementType = {
  PURCHASE: "PURCHASE",
  CONSUMPTION: "CONSUMPTION",
  ADJUSTMENT: "ADJUSTMENT",
  RETURN: "RETURN",
  AUDIT: "AUDIT",
  TRANSFER: "TRANSFER",
} as const;

export type StockMovementType = typeof StockMovementType[keyof typeof StockMovementType];

export const ADJUSTMENT_REASONS = [
  "Damaged Stock",
  "Lost / Missing",
  "Expired",
  "Counting Error",
  "Opening Balance",
  "Other",
];

export const CONSUMPTION_REASONS = [
  "Services",
  "Internal Use",
  "Tester / Demo",
  "Waste / Spillage",
  "Other",
];

export interface StockMovement {
  id: string;
  shopId?: string;
  inventoryItemId: string;
  itemName?: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  unitCost?: number;
  reason?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface InventoryAlertItem {
  itemId: string;
  name: string;
  sku: string;
  currentQuantity: number;
  minimumQuantity: number;
  unit: string;
}

export interface InventoryAlerts {
  lowStock: InventoryAlertItem[];
  outOfStock: InventoryAlertItem[];
}

export interface CategoryValuation {
  categoryName: string;
  itemCount: number;
  totalQuantity: number;
  totalValue: number;
}

export interface ItemValuation {
  itemId: string;
  name: string;
  sku: string;
  currentQuantity: number;
  averageCost: number;
  totalValue: number;
}

export interface ValuationReport {
  totalItems: number;
  totalQuantity: number;
  totalValuation: number;
  categories: CategoryValuation[];
  items: ItemValuation[];
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  stockStatus?: "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  includeInactive?: boolean;
}

export interface PurchaseFilters {
  supplierId?: string;
  status?: "ALL" | PurchaseStatus;
  startDate?: string;
  endDate?: string;
}
