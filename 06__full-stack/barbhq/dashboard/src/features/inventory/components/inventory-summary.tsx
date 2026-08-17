import React from "react";
import { Package, AlertTriangle, AlertCircle, Coins } from "lucide-react";
import { cn } from "../../../lib/utils";

interface InventorySummaryProps {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  className?: string;
}

export const InventorySummary: React.FC<InventorySummaryProps> = ({
  totalProducts,
  lowStockCount,
  outOfStockCount,
  totalStockValue,
  className,
}) => {
  const formatCurrency = (val: number) => {
    return `₨${val.toLocaleString("en-PK")}`;
  };

  const cards = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Low Stock",
      value: lowStockCount,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Out of Stock",
      value: outOfStockCount,
      icon: AlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
    {
      title: "Stock Value",
      value: formatCurrency(totalStockValue),
      icon: Coins,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between p-5 rounded-xl border bg-card text-card-foreground shadow-xs transition-all hover:shadow-md",
              card.borderColor,
            )}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {card.title}
              </p>
              <h3 className="text-2xl font-extrabold tracking-tight">{card.value}</h3>
            </div>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", card.bg, card.color)}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
