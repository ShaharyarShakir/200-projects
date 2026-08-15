import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { renderIcon } from "../../lib/navigation";
import { cn } from "../../lib/utils";

export interface SidebarItemProps {
  label: string;
  path: string;
  iconName: string;
  collapsed: boolean;
  onItemClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  path,
  iconName,
  collapsed,
  onItemClick,
}) => {
  const location = useLocation();

  const isActive =
    path === "/dashboard"
      ? location.pathname === "/" || location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <Link
      to={path}
      onClick={onItemClick}
      className={cn(
        "flex items-center rounded-lg px-3.5 py-3 text-sm font-semibold transition-all duration-200 gap-3 group relative cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <span className="flex shrink-0">
        {renderIcon(iconName, "h-5 w-5")}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}

      {collapsed && (
        <span className="absolute left-full ml-4 scale-0 rounded-md bg-foreground px-2 py-1.5 text-xs text-background font-bold group-hover:scale-100 transition-all duration-150 z-50 shadow-md">
          {label}
        </span>
      )}
    </Link>
  );
};
export default SidebarItem;
