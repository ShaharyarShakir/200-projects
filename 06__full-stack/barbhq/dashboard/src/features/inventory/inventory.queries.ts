import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "./inventory.api";
import type { ProductFilters, PurchaseFilters } from "./inventory.types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  overview: () => [...inventoryKeys.all, "overview"] as const,
  products: (filters?: ProductFilters) => [...inventoryKeys.all, "products", filters] as const,
  product: (id: string) => [...inventoryKeys.all, "product", id] as const,
  purchases: (filters?: PurchaseFilters) => [...inventoryKeys.all, "purchases", filters] as const,
  purchase: (id: string) => [...inventoryKeys.all, "purchase", id] as const,
  suppliers: () => [...inventoryKeys.all, "suppliers"] as const,
  categories: () => [...inventoryKeys.all, "categories"] as const,
  history: (id: string) => [...inventoryKeys.all, "history", id] as const,
  alerts: () => [...inventoryKeys.all, "alerts"] as const,
  movements: (limit?: number) => [...inventoryKeys.all, "movements", limit] as const,
  valuation: () => [...inventoryKeys.all, "valuation"] as const,
};

export const useInventoryProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: inventoryKeys.products(filters),
    queryFn: () => inventoryApi.getItems(filters),
  });
};

export const useInventoryProduct = (id: string) => {
  return useQuery({
    queryKey: inventoryKeys.product(id),
    queryFn: () => inventoryApi.getItemById(id),
    enabled: Boolean(id),
  });
};

export const useProductMovements = (id: string) => {
  return useQuery({
    queryKey: inventoryKeys.history(id),
    queryFn: () => inventoryApi.getItemMovements(id),
    enabled: Boolean(id),
  });
};

export const useInventoryCategories = () => {
  return useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: () => inventoryApi.getCategories(),
  });
};

export const useInventoryPurchases = (filters?: PurchaseFilters) => {
  return useQuery({
    queryKey: inventoryKeys.purchases(filters),
    queryFn: () => inventoryApi.getPurchases(filters),
  });
};

export const useInventorySuppliers = () => {
  return useQuery({
    queryKey: inventoryKeys.suppliers(),
    queryFn: () => inventoryApi.getSuppliers(),
  });
};

export const useInventoryAlerts = () => {
  return useQuery({
    queryKey: inventoryKeys.alerts(),
    queryFn: () => inventoryApi.getAlerts(),
    refetchInterval: 30000,
  });
};

export const useInventoryMovements = (limit = 100) => {
  return useQuery({
    queryKey: inventoryKeys.movements(limit),
    queryFn: () => inventoryApi.getMovements(limit),
  });
};

export const useInventoryValuation = () => {
  return useQuery({
    queryKey: inventoryKeys.valuation(),
    queryFn: () => inventoryApi.getValuationReport(),
  });
};

export const useInventoryOverview = () => {
  return useQuery({
    queryKey: inventoryKeys.overview(),
    queryFn: async () => {
      const [products, alerts, valuation, purchases, movements] = await Promise.all([
        inventoryApi.getItems(),
        inventoryApi.getAlerts(),
        inventoryApi.getValuationReport(),
        inventoryApi.getPurchases(),
        inventoryApi.getMovements(10),
      ]);

      const lowStockCount = alerts.lowStock.length;
      const outOfStockCount = alerts.outOfStock.length;
      const totalStockValue = valuation.totalValuation;

      return {
        totalProducts: products.length,
        lowStockCount,
        outOfStockCount,
        totalStockValue,
        alerts,
        recentPurchases: purchases.slice(0, 5),
        recentConsumption: movements.filter((m) => m.type === "CONSUMPTION").slice(0, 5),
        products,
      };
    },
  });
};
