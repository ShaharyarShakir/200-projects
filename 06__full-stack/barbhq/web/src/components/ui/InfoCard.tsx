import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { cn } from "../../lib/utils";

export interface InfoCardItem {
  label: string;
  value: React.ReactNode;
}

export interface InfoCardProps {
  title: string;
  items: InfoCardItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  items,
  columns = 2,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b border-border/10 mb-4">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <dl
          className={cn("grid gap-4.5", {
            "grid-cols-1": columns === 1,
            "grid-cols-1 sm:grid-cols-2": columns === 2,
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3": columns === 3,
          })}
        >
          {items.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <dt className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {item.label}
              </dt>
              <dd className="text-sm font-semibold text-foreground">
                {item.value !== undefined && item.value !== null
                  ? item.value
                  : "—"}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};
