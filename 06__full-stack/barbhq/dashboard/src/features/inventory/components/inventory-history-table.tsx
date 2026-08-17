import React from "react";
import { ArrowUpRight, ArrowDownRight, History } from "lucide-react";
import type { StockMovement } from "../inventory.types";
import { cn } from "../../../lib/utils";

interface InventoryHistoryTableProps {
  movements: StockMovement[];
  title?: string;
  className?: string;
}

export const InventoryHistoryTable: React.FC<InventoryHistoryTableProps> = ({
  movements,
  title,
  className,
}) => {
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-border bg-card">
        <History className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium">No Stock Movements Logged</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Purchases, consumption, and stock adjustments will be recorded here.
        </p>
      </div>
    );
  }

  const formatMovementType = (type: string) => {
    switch (type?.toUpperCase()) {
      case "PURCHASE":
        return { label: "Purchase", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
      case "CONSUMPTION":
        return { label: "Consumption", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
      case "ADJUSTMENT":
        return { label: "Adjustment", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
      default:
        return { label: type || "Movement", color: "bg-muted text-muted-foreground border-border" };
    }
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden shadow-xs", className)}>
      {title && (
        <div className="p-4 border-b border-border font-bold text-sm bg-muted/30">
          {title}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Product / Ref</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Reason / Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movements.map((movement) => {
              const typeInfo = formatMovementType(movement.type);
              const isPositive = movement.quantity > 0;
              const formattedDate = movement.createdAt
                ? new Date(movement.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recent";

              return (
                <tr key={movement.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    {formattedDate}
                  </td>

                  <td className="px-4 py-3 font-semibold text-foreground">
                    {movement.itemName || "Product Item"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border",
                        typeInfo.color,
                      )}
                    >
                      {typeInfo.label}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-extrabold">
                    <span
                      className={cn(
                        "inline-flex items-center justify-end gap-0.5",
                        isPositive ? "text-emerald-500" : "text-rose-500",
                      )}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {isPositive ? `+${movement.quantity}` : movement.quantity}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {movement.newQuantity !== undefined ? movement.newQuantity : "-"}
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {movement.reason || movement.reference || movement.notes || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
