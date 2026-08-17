import React from "react";
import { cn } from "../../../lib/utils";
import type { EmployeeRole } from "../employees.types";

interface EmployeeRoleBadgeProps {
  role: EmployeeRole | string;
  className?: string;
}

export const EmployeeRoleBadge: React.FC<EmployeeRoleBadgeProps> = ({ role, className }) => {
  const getStyle = () => {
    switch (role?.toUpperCase()) {
      case "OWNER":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "MANAGER":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "RECEPTIONIST":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "BARBER":
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const formattedRole = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "Staff";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border select-none tracking-wide",
        getStyle(),
        className,
      )}
    >
      {formattedRole}
    </span>
  );
};
