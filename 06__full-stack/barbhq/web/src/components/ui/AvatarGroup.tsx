import React from "react";
import { Avatar } from "./avatar";
import { cn } from "../../lib/utils";

export interface AvatarGroupItem {
  src?: string;
  name: string;
}

export interface AvatarGroupProps {
  items: AvatarGroupItem[];
  limit?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  items,
  limit = 4,
  size = "sm",
  className,
}) => {
  const visibleItems = items.slice(0, limit);
  const remainingCount = items.length - limit;

  return (
    <div className={cn("flex -space-x-2 select-none items-center", className)}>
      {visibleItems.map((item, idx) => (
        <div
          key={idx}
          className="inline-block rounded-full ring-2 ring-background hover:z-10 transition-all duration-200"
        >
          <Avatar src={item.src} name={item.name} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted border border-border ring-2 ring-background font-semibold text-muted-foreground shrink-0",
            {
              "h-8 w-8 text-[10px]": size === "sm",
              "h-10 w-10 text-xs": size === "md",
              "h-14 w-14 text-sm": size === "lg",
            },
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
