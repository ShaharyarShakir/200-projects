import React from "react";
import { Card, CardContent } from "./card";
import { cn } from "../../lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  hoverable?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  hoverable = true,
  className,
}) => {
  return (
    <Card
      hoverable={hoverable}
      className={cn("overflow-hidden relative", className)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/80 text-primary shadow-sm">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
        {(description || (trend && trend.label)) && (
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            {trend?.label || description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
