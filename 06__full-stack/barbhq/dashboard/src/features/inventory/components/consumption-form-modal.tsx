import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, TrendingDown } from "lucide-react";
import { consumptionSchema, type ConsumptionFormValues } from "../inventory.schemas";
import { CONSUMPTION_REASONS, type InventoryItem } from "../inventory.types";
import { Button } from "../../../components/ui/button";

interface ConsumptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConsumptionFormValues) => void;
  isLoading?: boolean;
  products: InventoryItem[];
  defaultProductId?: string;
}

export const ConsumptionFormModal: React.FC<ConsumptionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  products = [],
  defaultProductId,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ConsumptionFormValues>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      inventoryItemId: defaultProductId || (products[0]?.id ?? ""),
      quantity: 1,
      reason: CONSUMPTION_REASONS[0],
      notes: "",
    },
  });

  const selectedItemId = watch("inventoryItemId");
  const selectedProduct = products.find((p) => p.id === selectedItemId);

  useEffect(() => {
    if (isOpen) {
      reset({
        inventoryItemId: defaultProductId || (products[0]?.id ?? ""),
        quantity: 1,
        reason: CONSUMPTION_REASONS[0],
        notes: "",
      });
    }
  }, [isOpen, defaultProductId, products, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Consumption</h2>
              <p className="text-xs text-muted-foreground">
                Log products consumed during services or shop operations
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Product *
            </label>
            <select
              {...register("inventoryItemId")}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentQuantity} {p.unit.toLowerCase()} available)
                </option>
              ))}
            </select>
            {errors.inventoryItemId && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.inventoryItemId.message}
              </p>
            )}
          </div>

          {selectedProduct && (
            <div className="rounded-lg bg-muted/40 p-2.5 border border-border text-xs flex justify-between">
              <span className="text-muted-foreground">Available Stock:</span>
              <span className="font-bold">
                {selectedProduct.currentQuantity} {selectedProduct.unit.toLowerCase()}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Quantity Consumed *
            </label>
            <input
              type="number"
              {...register("quantity", { valueAsNumber: true })}
              placeholder="1"
              min="1"
              max={selectedProduct?.currentQuantity}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
            {errors.quantity && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Reason
            </label>
            <select
              {...register("reason")}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {CONSUMPTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Notes
            </label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="e.g. Used for 3 haircut services..."
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
              Record Consumption
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
