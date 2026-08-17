import React from "react";
import type { UserRole } from "../../../types";
import { cn } from "../../../lib/utils";

interface EmployeeRoleBadgeProps {
  role: UserRole | string;
  className?: string;
}

export const EmployeeRoleBadge: React.FC<EmployeeRoleBadgeProps> = ({
  role,
  className,
}) => {
  const normRole = role.toUpperCase();

  const styles: Record<string, string> = {
    OWNER: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    MANAGER: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30",
    RECEPTIONIST: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30",
    BARBER: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
  };

  const labels: Record<string, string> = {
    OWNER: "Owner",
    MANAGER: "Manager",
    RECEPTIONIST: "Receptionist",
    BARBER: "Barber",
  };

  const selectedStyle = styles[normRole] || "bg-secondary text-secondary-foreground border border-border";
  const label = labels[normRole] || role;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider leading-none select-none",
        selectedStyle,
        className,
      )}
    >
      {label}
    </span>
  );
};

export default EmployeeRoleBadge;
