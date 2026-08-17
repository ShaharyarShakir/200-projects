import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { inventoryApi } from "./inventory.api";
import { inventoryKeys } from "./inventory.queries";
import type {
  ProductFormValues,
  AdjustStockFormValues,
  ConsumptionFormValues,
  PurchaseOrderFormValues,
  SupplierFormValues,
  CategoryFormValues,
} from "./inventory.schemas";

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductFormValues) => inventoryApi.createItem(data),
    onSuccess: (newItem) => {
      toast.success(`Product "${newItem.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create product");
    },
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormValues> }) =>
      inventoryApi.updateItem(id, data),
    onSuccess: (updated) => {
      toast.success(`Product "${updated.name}" updated successfully`);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update product");
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteItem(id),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to delete product");
    },
  });
};

export const useAdjustStockMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustStockFormValues }) =>
      inventoryApi.adjustStock(id, payload),
    onSuccess: () => {
      toast.success("Stock level adjusted successfully");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to adjust stock");
    },
  });
};

export const useRecordConsumptionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConsumptionFormValues) => inventoryApi.recordConsumption(payload),
    onSuccess: () => {
      toast.success("Consumption recorded successfully");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to record consumption");
    },
  });
};

export const useCreatePurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PurchaseOrderFormValues) => inventoryApi.createPurchase(data),
    onSuccess: () => {
      toast.success("Purchase recorded & inventory updated");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to record purchase");
    },
  });
};

export const useReceivePurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: { inventoryItemId: string; quantityReceived: number }[] }) =>
      inventoryApi.receivePurchase(id, items),
    onSuccess: () => {
      toast.success("Purchase order received & stock updated");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to receive purchase");
    },
  });
};

export const useCreateSupplierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierFormValues) => inventoryApi.createSupplier(data),
    onSuccess: (vendor) => {
      toast.success(`Supplier "${vendor.name}" added successfully`);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to add supplier");
    },
  });
};

export const useUpdateSupplierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierFormValues> }) =>
      inventoryApi.updateSupplier(id, data),
    onSuccess: (vendor) => {
      toast.success(`Supplier "${vendor.name}" updated successfully`);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update supplier");
    },
  });
};

export const useDeleteSupplierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteSupplier(id),
    onSuccess: () => {
      toast.success("Supplier deleted successfully");
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to delete supplier");
    },
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryFormValues) => inventoryApi.createCategory(data),
    onSuccess: (cat) => {
      toast.success(`Category "${cat.name}" created`);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create category");
    },
  });
};
