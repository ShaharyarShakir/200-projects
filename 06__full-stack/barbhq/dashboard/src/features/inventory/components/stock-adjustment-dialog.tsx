import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, SlidersHorizontal } from "lucide-react";
import { adjustStockSchema, type AdjustStockFormValues } from "../inventory.schemas";
import { ADJUSTMENT_REASONS, type InventoryItem } from "../inventory.types";
import { Button } from "../../../components/ui/button";

interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdjustStockFormValues) => void;
  isLoading?: boolean;
  product: InventoryItem | null;
}

export const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  product,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      quantity: product?.currentQuantity ?? 0,
      reason: ADJUSTMENT_REASONS[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        quantity: product.currentQuantity ?? 0,
        reason: ADJUSTMENT_REASONS[0],
        notes: "",
      });
    }
  }, [product, isOpen, reset]);

  const targetQuantity = watch("quantity");
  const currentQuantity = product?.currentQuantity ?? 0;
  const delta = targetQuantity - currentQuantity;

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Adjust Stock</h2>
              <p className="text-xs text-muted-foreground">
                Log physical count adjustment or damaged stock
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

        {/* Product Brief */}
        <div className="rounded-lg bg-muted/40 p-3 mb-4 border border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">{product.name}</p>
            <p className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-semibold">Current Stock</p>
            <p className="text-base font-extrabold">{product.currentQuantity} {product.unit.toLowerCase()}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              New Physical Stock Level *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                {...register("quantity", { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-lg font-extrabold focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setValue("quantity", targetQuantity + 1)}
                  className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs font-bold cursor-pointer"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setValue("quantity", Math.max(0, targetQuantity - 1))}
                  className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs font-bold cursor-pointer"
                >
                  -1
                </button>
              </div>
            </div>
            {errors.quantity && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.quantity.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 font-semibold">
              Adjustment delta:{" "}
              <span
                className={
                  delta > 0
                    ? "text-emerald-500 font-extrabold"
                    : delta < 0
                    ? "text-rose-500 font-extrabold"
                    : "text-muted-foreground"
                }
              >
                {delta > 0 ? `+${delta}` : delta} units
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Adjustment Reason *
            </label>
            <select
              {...register("reason")}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.reason.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Notes / Explanation
            </label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="e.g. Broken jar during cleaning..."
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
              Save Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
