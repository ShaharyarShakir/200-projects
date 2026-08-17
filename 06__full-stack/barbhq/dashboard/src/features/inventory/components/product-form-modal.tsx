import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, PackagePlus } from "lucide-react";
import { productSchema, type ProductFormValues } from "../inventory.schemas";
import { INVENTORY_UNITS, INITIAL_CATEGORIES, type InventoryItem, type Vendor } from "../inventory.types";
import { Button } from "../../../components/ui/button";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormValues) => void;
  isLoading?: boolean;
  initialData?: InventoryItem | null;
  categories?: string[];
  suppliers?: Vendor[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
  categories = INITIAL_CATEGORIES,
  suppliers = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      categoryId: categories[0] || "Hair Care",
      unit: INVENTORY_UNITS[0].value,
      currentQuantity: 0,
      minimumQuantity: 5,
      reorderQuantity: 10,
      averageCost: 0,
      sellingPrice: undefined,
      supplierId: "",
      trackStock: true,
      isSellable: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        sku: initialData.sku || "",
        name: initialData.name || "",
        description: initialData.description || "",
        categoryId: typeof initialData.categoryId === "object" ? initialData.categoryId.id : (initialData.categoryId || categories[0]),
        unit: (initialData.unit as any) || INVENTORY_UNITS[0].value,
        currentQuantity: initialData.currentQuantity ?? 0,
        minimumQuantity: initialData.minimumQuantity ?? 5,
        reorderQuantity: initialData.reorderQuantity ?? 10,
        averageCost: initialData.averageCost ?? 0,
        sellingPrice: initialData.sellingPrice,
        supplierId: typeof initialData.supplierId === "object" ? initialData.supplierId.id : (initialData.supplierId || ""),
        trackStock: initialData.trackStock ?? true,
        isSellable: initialData.isSellable ?? false,
      });
    } else {
      reset({
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: "",
        description: "",
        categoryId: categories[0] || "Hair Care",
        unit: INVENTORY_UNITS[0].value,
        currentQuantity: 0,
        minimumQuantity: 5,
        reorderQuantity: 10,
        averageCost: 0,
        sellingPrice: undefined,
        supplierId: "",
        trackStock: true,
        isSellable: false,
      });
    }
  }, [initialData, isOpen, reset, categories]);

  const handleFormSubmit = (data: any) => {
    onSubmit(data as ProductFormValues);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-2xl text-card-foreground my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData ? "Edit Product" : "Add Product"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {initialData
                  ? "Update product information & minimum stock thresholds"
                  : "Add a new shop inventory item to track stock and costs"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Product Name *
              </label>
              <input
                {...register("name")}
                placeholder="e.g. Hair Wax, Shampoo"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              {errors.name && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                SKU *
              </label>
              <input
                {...register("sku")}
                placeholder="e.g. HW-001"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              {errors.sku && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.sku.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Category *
              </label>
              <select
                {...register("categoryId")}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.categoryId.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Unit *
              </label>
              <select
                {...register("unit")}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {INVENTORY_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.unit.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Minimum Stock Level
              </label>
              <input
                type="number"
                {...register("minimumQuantity", { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              {errors.minimumQuantity && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.minimumQuantity.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Cost Per Unit (₨)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("averageCost", { valueAsNumber: true })}
                placeholder="450"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              {errors.averageCost && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.averageCost.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Selling Price (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("sellingPrice", {
                  setValueAs: (v) => (v === "" || isNaN(v) ? undefined : Number(v)),
                })}
                placeholder="Retail price if sold"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Preferred Supplier (Optional)
            </label>
            <select
              {...register("supplierId")}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="">None / Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Description / Notes
            </label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Internal usage details, specs..."
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-6 pt-2 border-t border-border">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                {...register("trackStock")}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              Track Stock Levels
            </label>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                {...register("isSellable")}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              Is Retail Sellable Product
            </label>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="cursor-pointer font-bold">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
