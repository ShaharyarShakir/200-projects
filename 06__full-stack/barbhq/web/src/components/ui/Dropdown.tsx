import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "right",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="inline-block relative text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={cn(
            "z-30 absolute bg-card shadow-xl dark:shadow-black/40 mt-2 p-1.5 border border-border rounded-lg w-56 animate-scale-in",
            {
              "left-0 origin-top-left": align === "left",
              "right-0 origin-top-right": align === "right",
            },
            className,
          )}
        >
          <div className="flex flex-col gap-0.5" role="menu">
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md w-full font-medium text-sm text-left transition-all cursor-pointer",
                  {
                    "text-foreground hover:bg-secondary":
                      item.variant !== "destructive",
                    "text-destructive hover:bg-destructive/10":
                      item.variant === "destructive",
                  },
                )}
                role="menuitem"
              >
                {item.icon && (
                  <span className="flex text-muted-foreground shrink-0">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
