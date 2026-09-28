import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientVMStatus } from "@/lib/api/types";

export interface VMStatusBadgeProps extends React.ComponentProps<typeof Badge> {
  status: ClientVMStatus | string;
}

export function getStatusConfig(status: ClientVMStatus | string): {
  label: string;
  dotClass: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
  badgeClass?: string;
} {
  switch (status) {
    case "running":
      return {
        label: "Running",
        dotClass: "bg-emerald-500 animate-pulse",
        badgeVariant: "outline",
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };
    case "stopped":
      return {
        label: "Stopped",
        dotClass: "bg-zinc-400 dark:bg-zinc-500",
        badgeVariant: "secondary",
        badgeClass: "text-muted-foreground",
      };
    case "unknown":
    default:
      return {
        label: "Unknown",
        dotClass: "bg-amber-500",
        badgeVariant: "outline",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
  }
}

export function VMStatusBadge({ status, className, ...props }: VMStatusBadgeProps) {
  const { label, dotClass, badgeVariant, badgeClass } = getStatusConfig(status);

  return (
    <Badge
      variant={badgeVariant}
      className={cn("gap-1.5 px-2 py-0.5 text-xs font-medium", badgeClass, className)}
      {...props}
    >
      <span className={cn("size-2 rounded-full inline-block shrink-0", dotClass)} aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}
