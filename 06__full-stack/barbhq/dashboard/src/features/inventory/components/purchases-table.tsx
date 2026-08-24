import React from "react";
import { CheckCircle2, ShoppingCart, Clock } from "lucide-react";
import type { PurchaseOrder } from "../inventory.types";
import { Button } from "../../../components/ui/button";

interface PurchasesTableProps {
  purchases: PurchaseOrder[];
  onReceivePurchase?: (id: string, items: any[]) => void;
  isReceiving?: boolean;
}

export const PurchasesTable: React.FC<PurchasesTableProps> = ({
  purchases,
  onReceivePurchase,
  isReceiving = false,
}) => {
  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-border bg-card">
        <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <h3 className="text-base font-bold">No Purchase Orders Recorded</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Record stock purchases from suppliers to update inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-muted-foreground">
            <tr>
              <th className="px-4 py-3.5">PO Number</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Supplier</th>
              <th className="px-4 py-3.5">Items</th>
              <th className="px-4 py-3.5">Total Cost</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.map((po) => {
              const itemCount = po.items?.reduce(
                (acc, i) => acc + (i.quantityOrdered || 1),
                0,
              );
              const dateFormatted = po.orderDate
                ? new Date(po.orderDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent";

              const isReceived = po.status === "RECEIVED";

              return (
                <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-foreground">
                    {po.purchaseNumber}
                  </td>

                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {dateFormatted}
                  </td>

                  <td className="px-4 py-3.5 font-bold text-foreground">
                    {po.supplierName || "Supplier"}
                  </td>

                  <td className="px-4 py-3.5 text-foreground font-semibold">
                    {itemCount} {itemCount === 1 ? "unit" : "units"} ({po.items?.length || 0} items)
                  </td>

                  <td className="px-4 py-3.5 font-extrabold text-foreground">
                    ₨{po.totalAmount.toLocaleString("en-PK")}
                  </td>

                  <td className="px-4 py-3.5">
                    {isReceived ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Received
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        {po.status || "Ordered"}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    {!isReceived && onReceivePurchase && (
                      <Button
                        size="sm"
                        onClick={() =>
                          onReceivePurchase(
                            po.id,
                            po.items.map((i) => ({
                              inventoryItemId: i.inventoryItemId,
                              quantityReceived: i.quantityOrdered,
                            })),
                          )
                        }
                        disabled={isReceiving}
                        className="h-7 text-xs font-bold cursor-pointer"
                      >
                        Receive Stock
                      </Button>
                    )}
                    {isReceived && (
                      <span className="text-xs text-muted-foreground font-medium italic">
                        Stock updated
                      </span>
                    )}
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
