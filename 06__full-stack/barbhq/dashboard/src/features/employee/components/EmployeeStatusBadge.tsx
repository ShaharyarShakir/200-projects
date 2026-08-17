import React from "react";
import type { EmployeeStatus } from "../../../types";
import { cn } from "../../../lib/utils";

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus | string;
  className?: string;
}

export const EmployeeStatusBadge: React.FC<EmployeeStatusBadgeProps> = ({
  status,
  className,
}) => {
  const normStatus = status.toUpperCase();

  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    INACTIVE: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
    SUSPENDED: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
    ON_LEAVE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  };

  const labels: Record<string, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SUSPENDED: "Suspended",
    ON_LEAVE: "On Leave",
  };

  const selectedStyle = styles[normStatus] || "bg-muted text-muted-foreground border";
  const label = labels[normStatus] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold select-none leading-none tracking-wide capitalize",
        selectedStyle,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
      {label}
    </span>
  );
};

export default EmployeeStatusBadge;
