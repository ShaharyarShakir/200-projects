import React from "react";
import { PageTitle } from "../ui/PageTitle";
import { cn } from "../../lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none mb-6 pb-4 border-b border-border/20",
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <PageTitle>{title}</PageTitle>
        {description && (
          <p className="text-sm text-muted-foreground font-medium leading-relaxed mt-0.5">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">{actions}</div>
      )}
    </div>
  );
};
