import React from "react";
import { cn } from "../../../lib/utils";

interface StockStatusBadgeProps {
  currentQuantity: number;
  minimumQuantity: number;
  className?: string;
  showCount?: boolean;
}

export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({
  currentQuantity,
  minimumQuantity,
  className,
  showCount = false,
}) => {
  if (currentQuantity <= 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
        Out of Stock {showCount && `(0)`}
      </span>
    );
  }

  if (currentQuantity <= minimumQuantity) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Low Stock {showCount && `(${currentQuantity})`}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      In Stock {showCount && `(${currentQuantity})`}
    </span>
  );
};
