import React from "react";
import { Badge } from "./badge";

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  const normalized = status.toUpperCase().replace(/_/g, " ");

  let variant: "default" | "success" | "warning" | "destructive" | "info" =
    "default";
  const label = status.replace(/_/g, " ");

  if (
    ["CONFIRMED", "ACTIVE", "COMPLETED", "SUCCESS", "ON DUTY"].includes(
      normalized,
    )
  ) {
    variant = "success";
  } else if (["PENDING", "WARNING", "LOW", "LOW STOCK"].includes(normalized)) {
    variant = "warning";
  } else if (
    [
      "CANCELLED",
      "NO SHOW",
      "INACTIVE",
      "OFF DUTY",
      "OUT OF STOCK",
      "DESTRUCTIVE",
    ].includes(normalized)
  ) {
    variant = "destructive";
  } else if (
    ["INFO", "RECEPTIONIST", "MANAGER", "BARBER", "OWNER"].includes(normalized)
  ) {
    variant = "info";
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};
