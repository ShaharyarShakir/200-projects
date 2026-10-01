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
        dotClass: "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]",
        badgeVariant: "outline",
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium",
      };
    case "stopped":
      return {
        label: "Stopped",
        dotClass: "bg-zinc-400 dark:bg-zinc-500",
        badgeVariant: "secondary",
        badgeClass: "text-muted-foreground border-transparent bg-muted/60 dark:bg-muted/40 font-medium",
      };
    case "starting":
      return {
        label: "Starting",
        dotClass: "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]",
        badgeVariant: "outline",
        badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium",
      };
    case "stopping":
      return {
        label: "Stopping",
        dotClass: "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]",
        badgeVariant: "outline",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium",
      };
    case "creating":
      return {
        label: "Creating",
        dotClass: "bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.6)]",
        badgeVariant: "outline",
        badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-medium",
      };
    case "error":
      return {
        label: "Error",
        dotClass: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
        badgeVariant: "destructive",
        badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium",
      };
    case "unknown":
    default:
      return {
        label: "Unknown",
        dotClass: "bg-amber-500",
        badgeVariant: "outline",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium",
      };
  }
}

export function VMStatusBadge({ status, className, ...props }: VMStatusBadgeProps) {
  const { label, dotClass, badgeVariant, badgeClass } = getStatusConfig(status);

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        "gap-1.5 px-2.5 py-0.5 text-xs font-medium tracking-tight rounded-full transition-all duration-200",
        badgeClass,
        className
      )}
      aria-label={`Status: ${label}`}
      {...props}
    >
      <span
        className={cn("size-2 rounded-full inline-block shrink-0", dotClass)}
        aria-hidden="true"
      />
      <span>{label}</span>
    </Badge>
  );
}
