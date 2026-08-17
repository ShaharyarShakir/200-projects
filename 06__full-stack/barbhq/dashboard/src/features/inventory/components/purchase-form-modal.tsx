import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Plus, Trash2, ShoppingCart } from "lucide-react";
import { purchaseOrderSchema, type PurchaseOrderFormValues } from "../inventory.schemas";
import type { InventoryItem, Vendor } from "../inventory.types";
import { Button } from "../../../components/ui/button";

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseOrderFormValues) => void;
  isLoading?: boolean;
  suppliers: Vendor[];
  products: InventoryItem[];
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  suppliers = [],
  products = [],
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: suppliers[0]?.id || "",
      orderDate: new Date().toISOString().split("T")[0],
      items: [
        {
          inventoryItemId: products[0]?.id || "",
          quantityOrdered: 10,
          unitCost: products[0]?.averageCost || 0,
        },
      ],
      tax: 0,
      discount: 0,
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        supplierId: suppliers[0]?.id || "",
        orderDate: new Date().toISOString().split("T")[0],
        items: [
          {
            inventoryItemId: products[0]?.id || "",
            quantityOrdered: 10,
            unitCost: products[0]?.averageCost || 0,
          },
        ],
        tax: 0,
        discount: 0,
        notes: "",
      });
    }
  }, [isOpen, suppliers, products, reset]);

  const watchedItems = watch("items") || [];
  const tax = watch("tax") || 0;
  const discount = watch("discount") || 0;

  const subtotal = watchedItems.reduce((acc: number, item: any) => {
    const qty = Number(item?.quantityOrdered) || 0;
    const cost = Number(item?.unitCost) || 0;
    return acc + qty * cost;
  }, 0);

  const grandTotal = Math.max(0, subtotal + Number(tax) - Number(discount));

  const handleProductChange = (index: number, productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      setValue(`items.${index}.unitCost`, p.averageCost || 0);
    }
  };

  const handleFormSubmit = (data: any) => {
    onSubmit(data as PurchaseOrderFormValues);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl text-card-foreground my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Purchase</h2>
              <p className="text-xs text-muted-foreground">
                Log inventory purchase order from supplier to add stock
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
                Supplier / Vendor *
              </label>
              <select
                {...register("supplierId")}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.supplierId.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Purchase Date
              </label>
              <input
                type="date"
                {...register("orderDate")}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Items Purchased *
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    inventoryItemId: products[0]?.id || "",
                    quantityOrdered: 5,
                    unitCost: products[0]?.averageCost || 0,
                  })
                }
                className="h-7 text-xs gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>

            {errors.items && typeof errors.items.message === "string" && (
              <p className="text-xs text-rose-500 mb-2 font-medium">
                {errors.items.message}
              </p>
            )}

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {fields.map((field, index) => {
                const itemQty = watchedItems[index]?.quantityOrdered || 0;
                const itemCost = watchedItems[index]?.unitCost || 0;
                const lineTotal = itemQty * itemCost;

                return (
                  <div
                    key={field.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        {...register(`items.${index}.inventoryItemId` as const)}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        {...register(`items.${index}.quantityOrdered` as const, {
                          valueAsNumber: true,
                        })}
                        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Cost"
                        {...register(`items.${index}.unitCost` as const, {
                          valueAsNumber: true,
                        })}
                        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="w-28 text-right font-extrabold text-sm text-foreground">
                      ₨{lineTotal.toLocaleString("en-PK")}
                    </div>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtotal & Total */}
          <div className="rounded-lg bg-muted/60 p-3.5 border border-border space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-semibold text-foreground">
                ₨{subtotal.toLocaleString("en-PK")}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-extrabold pt-2 border-t border-border text-foreground">
              <span>Grand Total Purchase Cost:</span>
              <span className="text-xl text-primary font-black">
                ₨{grandTotal.toLocaleString("en-PK")}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Notes
            </label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="e.g. Invoice #10294, delivered via Express..."
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

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
              Record Purchase
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
