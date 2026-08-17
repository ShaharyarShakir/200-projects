import { api } from "../../lib/api";
import type {
  InventoryItem,
  InventoryCategory,
  Vendor,
  PurchaseOrder,
  StockMovement,
  InventoryAlerts,
  ValuationReport,
  ProductFilters,
  PurchaseFilters,
} from "./inventory.types";
import type {
  ProductFormValues,
  AdjustStockFormValues,
  ConsumptionFormValues,
  PurchaseOrderFormValues,
  SupplierFormValues,
  CategoryFormValues,
} from "./inventory.schemas";

export const mapInventoryItem = (data: any): InventoryItem => {
  let categoryName = "Uncategorized";
  let categoryId = "";
  if (data.categoryId) {
    if (typeof data.categoryId === "object") {
      categoryId = data.categoryId.id || data.categoryId._id || "";
      categoryName = data.categoryId.name || "Uncategorized";
    } else {
      categoryId = data.categoryId;
    }
  }

  let supplierName = "";
  let supplierId = "";
  if (data.supplierId) {
    if (typeof data.supplierId === "object") {
      supplierId = data.supplierId.id || data.supplierId._id || "";
      supplierName = data.supplierId.name || data.supplierId.contactName || "";
    } else {
      supplierId = data.supplierId;
    }
  }

  return {
    id: data.id || data._id,
    shopId: data.shopId || "",
    sku: data.sku || "",
    name: data.name || "",
    description: data.description || "",
    categoryId,
    categoryName: data.categoryName || categoryName,
    unit: data.unit || "PIECE",
    currentQuantity: data.currentQuantity ?? 0,
    minimumQuantity: data.minimumQuantity ?? 0,
    reorderQuantity: data.reorderQuantity ?? 0,
    averageCost: data.averageCost ?? 0,
    sellingPrice: data.sellingPrice,
    supplierId,
    supplierName,
    trackStock: data.trackStock ?? true,
    isSellable: data.isSellable ?? false,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

export const mapPurchaseOrder = (data: any): PurchaseOrder => {
  let supplierName = "Unknown Supplier";
  let supplierId = "";
  if (data.supplierId) {
    if (typeof data.supplierId === "object") {
      supplierId = data.supplierId.id || data.supplierId._id || "";
      supplierName = data.supplierId.name || "Unknown Supplier";
    } else {
      supplierId = data.supplierId;
    }
  }

  const items = Array.isArray(data.items)
    ? data.items.map((item: any) => ({
        inventoryItemId:
          typeof item.inventoryItemId === "object"
            ? item.inventoryItemId.id || item.inventoryItemId._id
            : item.inventoryItemId,
        itemName:
          typeof item.inventoryItemId === "object"
            ? item.inventoryItemId.name
            : item.itemName || "Product",
        itemSku:
          typeof item.inventoryItemId === "object"
            ? item.inventoryItemId.sku
            : item.itemSku || "",
        quantityOrdered: item.quantityOrdered ?? item.quantity ?? 1,
        quantityReceived: item.quantityReceived ?? 0,
        unitCost: item.unitCost ?? 0,
        discount: item.discount ?? 0,
        tax: item.tax ?? 0,
        totalCost: item.totalCost ?? (item.quantityOrdered || 1) * (item.unitCost || 0),
      }))
    : [];

  return {
    id: data.id || data._id,
    shopId: data.shopId || "",
    purchaseNumber: data.purchaseNumber || `PO-${data.id?.slice(-6) || "101"}`,
    supplierId,
    supplierName,
    orderDate: data.orderDate || data.createdAt || new Date().toISOString(),
    expectedDate: data.expectedDate,
    receivedDate: data.receivedDate,
    status: data.status || "RECEIVED",
    items,
    subtotal: data.subtotal || data.totalAmount || 0,
    tax: data.tax || 0,
    discount: data.discount || 0,
    totalAmount: data.totalAmount || 0,
    notes: data.notes || "",
    createdBy: data.createdBy,
    createdAt: data.createdAt,
  };
};

export const mapVendor = (data: any): Vendor => {
  return {
    id: data.id || data._id,
    shopId: data.shopId,
    name: data.name || "",
    contactName: data.contactName || "",
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    totalPurchases: data.totalPurchases || 0,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt,
  };
};

export const mapStockMovement = (data: any): StockMovement => {
  let itemName = "Product";
  let inventoryItemId = "";
  if (data.inventoryItemId) {
    if (typeof data.inventoryItemId === "object") {
      inventoryItemId = data.inventoryItemId.id || data.inventoryItemId._id;
      itemName = data.inventoryItemId.name || "Product";
    } else {
      inventoryItemId = data.inventoryItemId;
    }
  }

  return {
    id: data.id || data._id,
    shopId: data.shopId || "",
    inventoryItemId,
    itemName: data.itemName || itemName,
    type: data.type || "ADJUSTMENT",
    quantity: data.quantity ?? 0,
    previousQuantity: data.previousQuantity,
    newQuantity: data.newQuantity,
    unitCost: data.unitCost,
    reason: data.reason || "",
    reference: data.reference || "",
    notes: data.notes || "",
    createdBy: data.createdBy,
    createdAt: data.createdAt || new Date().toISOString(),
  };
};

export const inventoryApi = {
  // --- Products ---
  getItems: async (filters?: ProductFilters): Promise<InventoryItem[]> => {
    const rawData = await api.get<any[]>("/inventory/items", {
      categoryId: filters?.categoryId,
      includeInactive: filters?.includeInactive,
    });
    const list = Array.isArray(rawData) ? rawData : [];
    let items = list.map(mapInventoryItem);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          (i.categoryName && i.categoryName.toLowerCase().includes(q)),
      );
    }

    if (filters?.stockStatus && filters.stockStatus !== "ALL") {
      if (filters.stockStatus === "OUT_OF_STOCK") {
        items = items.filter((i) => i.currentQuantity <= 0);
      } else if (filters.stockStatus === "LOW_STOCK") {
        items = items.filter(
          (i) => i.currentQuantity > 0 && i.currentQuantity <= i.minimumQuantity,
        );
      } else if (filters.stockStatus === "IN_STOCK") {
        items = items.filter((i) => i.currentQuantity > i.minimumQuantity);
      }
    }

    return items;
  },

  getItemById: async (id: string): Promise<InventoryItem> => {
    const rawData = await api.get<any>(`/inventory/items/${id}`);
    return mapInventoryItem(rawData);
  },

  createItem: async (data: ProductFormValues): Promise<InventoryItem> => {
    const rawData = await api.post<any>("/inventory/items", data);
    return mapInventoryItem(rawData);
  },

  updateItem: async (id: string, data: Partial<ProductFormValues>): Promise<InventoryItem> => {
    const rawData = await api.patch<any>(`/inventory/items/${id}`, data);
    return mapInventoryItem(rawData);
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/inventory/items/${id}`);
  },

  adjustStock: async (id: string, payload: AdjustStockFormValues): Promise<any> => {
    return api.post(`/inventory/items/${id}/adjust`, payload);
  },

  recordConsumption: async (payload: ConsumptionFormValues): Promise<any> => {
    return api.post("/inventory/consumption", payload);
  },

  getItemMovements: async (id: string): Promise<StockMovement[]> => {
    const rawData = await api.get<any[]>(`/inventory/items/${id}/movements`);
    const list = Array.isArray(rawData) ? rawData : [];
    return list.map(mapStockMovement);
  },

  // --- Categories ---
  getCategories: async (): Promise<InventoryCategory[]> => {
    const rawData = await api.get<any[]>("/inventory/categories");
    const list = Array.isArray(rawData) ? rawData : [];
    return list.map((cat: any) => ({
      id: cat.id || cat._id,
      shopId: cat.shopId,
      name: cat.name,
      description: cat.description,
    }));
  },

  createCategory: async (data: CategoryFormValues): Promise<InventoryCategory> => {
    const rawData = await api.post<any>("/inventory/categories", data);
    return {
      id: rawData.id || rawData._id,
      name: rawData.name,
      description: rawData.description,
    };
  },

  // --- Purchases ---
  getPurchases: async (filters?: PurchaseFilters): Promise<PurchaseOrder[]> => {
    const rawData = await api.get<any[]>("/purchases");
    const list = Array.isArray(rawData) ? rawData : [];
    let purchases = list.map(mapPurchaseOrder);

    if (filters?.supplierId) {
      purchases = purchases.filter((p) => p.supplierId === filters.supplierId);
    }
    if (filters?.status && filters.status !== "ALL") {
      purchases = purchases.filter((p) => p.status === filters.status);
    }

    return purchases;
  },

  getPurchaseById: async (id: string): Promise<PurchaseOrder> => {
    const rawData = await api.get<any>(`/purchases/${id}`);
    return mapPurchaseOrder(rawData);
  },

  createPurchase: async (data: PurchaseOrderFormValues): Promise<PurchaseOrder> => {
    const rawData = await api.post<any>("/purchases", {
      ...data,
      status: "ORDERED",
    });

    // Auto receive for V1 shop manager convenience if backend doesn't automatically receive it
    const po = mapPurchaseOrder(rawData);
    if (po.id && po.status !== "RECEIVED") {
      try {
        const receiveItems = data.items.map((i) => ({
          inventoryItemId: i.inventoryItemId,
          quantityReceived: i.quantityOrdered,
        }));
        const receivedData = await api.post<any>(`/purchases/${po.id}/receive`, {
          items: receiveItems,
        });
        return mapPurchaseOrder(receivedData);
      } catch {
        return po;
      }
    }
    return po;
  },

  receivePurchase: async (id: string, items: { inventoryItemId: string; quantityReceived: number }[]): Promise<PurchaseOrder> => {
    const rawData = await api.post<any>(`/purchases/${id}/receive`, { items });
    return mapPurchaseOrder(rawData);
  },

  // --- Suppliers / Vendors ---
  getSuppliers: async (): Promise<Vendor[]> => {
    const rawData = await api.get<any[]>("/vendors");
    const list = Array.isArray(rawData) ? rawData : [];
    return list.map(mapVendor);
  },

  createSupplier: async (data: SupplierFormValues): Promise<Vendor> => {
    const rawData = await api.post<any>("/vendors", data);
    return mapVendor(rawData);
  },

  updateSupplier: async (id: string, data: Partial<SupplierFormValues>): Promise<Vendor> => {
    const rawData = await api.patch<any>(`/vendors/${id}`, data);
    return mapVendor(rawData);
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await api.delete(`/vendors/${id}`);
  },

  // --- Reports & Alerts ---
  getAlerts: async (): Promise<InventoryAlerts> => {
    const rawData = await api.get<any>("/inventory/alerts");
    return {
      lowStock: Array.isArray(rawData?.lowStock) ? rawData.lowStock : [],
      outOfStock: Array.isArray(rawData?.outOfStock) ? rawData.outOfStock : [],
    };
  },

  getValuationReport: async (): Promise<ValuationReport> => {
    const rawData = await api.get<any>("/inventory/reports/valuation");
    return {
      totalItems: rawData?.totalItems || 0,
      totalQuantity: rawData?.totalQuantity || 0,
      totalValuation: rawData?.totalValuation || 0,
      categories: Array.isArray(rawData?.categories) ? rawData.categories : [],
      items: Array.isArray(rawData?.items) ? rawData.items : [],
    };
  },

  getMovements: async (limit = 100): Promise<StockMovement[]> => {
    const rawData = await api.get<any[]>("/inventory/reports/movements", { limit });
    const list = Array.isArray(rawData) ? rawData : [];
    return list.map(mapStockMovement);
  },
};
