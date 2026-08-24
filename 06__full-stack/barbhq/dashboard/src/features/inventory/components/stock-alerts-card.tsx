import React from "react";
import { AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { InventoryAlerts } from "../inventory.types";
import { cn } from "../../../lib/utils";

interface StockAlertsCardProps {
  alerts?: InventoryAlerts;
  className?: string;
}

export const StockAlertsCard: React.FC<StockAlertsCardProps> = ({ alerts, className }) => {
  const lowStock = alerts?.lowStock || [];
  const outOfStock = alerts?.outOfStock || [];

  const totalAlerts = lowStock.length + outOfStock.length;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-xs", className)}>
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-base">Stock Alerts</h3>
            <p className="text-xs text-muted-foreground">
              {totalAlerts === 0
                ? "All products are sufficiently stocked"
                : `${totalAlerts} items require attention`}
            </p>
          </div>
        </div>
        <Link
          to="/app/inventory/products"
          search={{ stockStatus: "LOW_STOCK" }}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {totalAlerts === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
          <ShieldCheck className="h-10 w-10 text-emerald-500 mb-2 opacity-80" />
          <p className="text-sm font-medium text-foreground">Stock Healthy</p>
          <p className="text-xs text-muted-foreground">No low stock or out-of-stock items detected.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {outOfStock.map((item) => (
            <div
              key={item.itemId}
              className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/15"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 rounded-full bg-rose-500 shrink-0 animate-ping" />
                <div>
                  <p className="text-sm font-bold leading-none">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    SKU: {item.sku}
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-md">
                0 remaining (Out)
              </span>
            </div>
          ))}

          {lowStock.map((item) => (
            <div
              key={item.itemId}
              className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold leading-none">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    SKU: {item.sku}
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
                {item.currentQuantity} {item.unit.toLowerCase()} remaining
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
