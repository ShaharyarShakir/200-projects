import React from "react";
import { Scissors, LogOut } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { SidebarGroup } from "./SidebarGroup";
import { navigationConfig } from "../../lib/navigation";
import { useSidebarStore } from "../../store/sidebarStore";
import { useAuth } from "../../features/auth";
import { can } from "../../lib/permissions";
import { cn } from "../../lib/utils";

export interface SidebarProps {
  onItemClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const { collapsed } = useSidebarStore();
  const { user, logout } = useAuth();

  const filteredNavigation = navigationConfig.filter((item) => {
    if ("items" in item) {
      const allowedItems = item.items.filter(
        (subItem) => !subItem.permission || can(user, subItem.permission),
      );
      return allowedItems.length > 0;
    }
    return !item.permission || can(user, item.permission);
  });

  return (
    <div className="flex h-full flex-col justify-between py-4 select-none bg-card text-card-foreground">
      <div>
        {/* Brand Logo Header */}
        <div
          className={cn(
            "flex items-center px-4 mb-8",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/10">
            <Scissors className="h-5 w-5 -rotate-45" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-serif text-base font-extrabold tracking-wider uppercase text-primary leading-none">
                BarbHQ
              </h1>
              <p className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5 font-bold">
                Shop Console
              </p>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1 px-2">
          {filteredNavigation.map((item, idx) => {
            if ("items" in item) {
              const allowedSubItems = item.items.filter(
                (subItem) => !subItem.permission || can(user, subItem.permission),
              );
              return (
                <SidebarGroup
                  key={idx}
                  label={item.label}
                  items={allowedSubItems}
                  collapsed={collapsed}
                  onItemClick={onItemClick}
                />
              );
            }
            return (
              <SidebarItem
                key={item.path}
                label={item.label}
                path={item.path}
                iconName={item.iconName}
                collapsed={collapsed}
                onItemClick={onItemClick}
              />
            );
          })}
        </nav>
      </div>

      {/* Logout Trigger at the bottom */}
      <div className="px-2">
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center rounded-lg px-3.5 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all duration-200 gap-3 cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-destructive",
            collapsed ? "justify-center" : "",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
