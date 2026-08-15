import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import type { NavigationItem } from "../../lib/navigation";

export interface SidebarGroupProps {
  label: string;
  items: NavigationItem[];
  collapsed: boolean;
  onItemClick?: () => void;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  label,
  items,
  collapsed,
  onItemClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (collapsed) {
    return (
      <div className="flex flex-col gap-1 py-1 border-t border-b border-border/10 my-1">
        {items.map((item) => (
          <SidebarItem
            key={item.path}
            label={item.label}
            path={item.path}
            iconName={item.iconName}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1 select-none">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80 hover:text-foreground cursor-pointer focus:outline-none"
      >
        <span>{label}</span>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      {isExpanded && (
        <div className="flex flex-col gap-1 pl-1">
          {items.map((item) => (
            <SidebarItem
              key={item.path}
              label={item.label}
              path={item.path}
              iconName={item.iconName}
              collapsed={collapsed}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default SidebarGroup;
