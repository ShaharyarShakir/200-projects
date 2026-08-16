import React from "react";
import { cn } from "../../lib/utils";

export type TableWrapperProps = React.HTMLAttributes<HTMLDivElement>;

export const TableWrapper = React.forwardRef<HTMLDivElement, TableWrapperProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
TableWrapper.displayName = "TableWrapper";

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("w-full border-collapse text-left text-sm", className)}
    {...props}
  />
));
Table.displayName = "Table";

export const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-secondary/40 border-b border-border/80", className)}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "divide-y divide-border/50 [&_tr:last-child]:border-0",
      className,
    )}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors hover:bg-secondary/20 data-[state=selected]:bg-secondary/30",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHeader = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase tracking-wider text-xs border-b border-border/40",
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle text-foreground font-medium", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";
