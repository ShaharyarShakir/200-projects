import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingDown,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { cn } from "../../../lib/utils";

interface InventoryNavProps {
  className?: string;
}

export const InventoryNav: React.FC<InventoryNavProps> = ({ className }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      label: "Overview",
      to: "/app/inventory",
      exact: true,
      icon: LayoutDashboard,
    },
    {
      label: "Products",
      to: "/app/inventory/products",
      exact: false,
      icon: Package,
    },
    {
      label: "Purchases",
      to: "/app/inventory/purchases",
      exact: false,
      icon: ShoppingCart,
    },
    {
      label: "Consumption",
      to: "/app/inventory/consumption",
      exact: false,
      icon: TrendingDown,
    },
    {
      label: "Adjustments",
      to: "/app/inventory/adjustments",
      exact: false,
      icon: SlidersHorizontal,
    },
    {
      label: "Suppliers",
      to: "/app/inventory/suppliers",
      exact: false,
      icon: Truck,
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-border bg-card/50 p-1 mb-6 rounded-lg",
        className,
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? currentPath === item.to || currentPath === "/inventory"
          : currentPath.startsWith(item.to);

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer",
              isActive
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
