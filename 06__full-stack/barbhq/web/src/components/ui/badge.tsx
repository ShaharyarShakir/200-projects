import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "info";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border transition-colors",
        {
          "bg-secondary border-border text-secondary-foreground":
            variant === "default",
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400":
            variant === "success",
          "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400":
            variant === "warning",
          "bg-destructive/10 border-destructive/20 text-destructive dark:text-red-400":
            variant === "destructive",
          "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400":
            variant === "info",
        },
        className,
      )}
      {...props}
    />
  );
};
