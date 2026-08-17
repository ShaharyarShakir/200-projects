import React from "react";
import { cn } from "../../../lib/utils";
import type { EmployeeStatus } from "../employees.types";

interface EmployeeStatusBadgeProps {
  status?: EmployeeStatus | string;
  isActive?: boolean;
  className?: string;
}

export const EmployeeStatusBadge: React.FC<EmployeeStatusBadgeProps> = ({
  status,
  isActive,
  className,
}) => {
  const currentStatus = status || (isActive ? "ACTIVE" : "INACTIVE");

  const getStyle = () => {
    switch (currentStatus) {
      case "ACTIVE":
        return {
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          dot: "bg-emerald-500 animate-pulse",
          label: "Active",
        };
      case "ON_LEAVE":
        return {
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          dot: "bg-amber-500",
          label: "On Leave",
        };
      case "INACTIVE":
      default:
        return {
          bg: "bg-muted text-muted-foreground border-border",
          dot: "bg-muted-foreground/50",
          label: "Inactive",
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border select-none transition-all",
        style.bg,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />
      <span>{style.label}</span>
    </span>
  );
};
