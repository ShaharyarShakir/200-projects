import React from "react";
import { Skeleton } from "./skeleton";
import { Card, CardHeader, CardContent } from "./card";
import {
  TableWrapper,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "./TableWrapper";
import { cn } from "../../lib/utils";

// Spinner component
export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-muted border-t-primary",
        sizeClasses[size],
        className,
      )}
    />
  );
};

// PageLoader component
export const PageLoader: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 select-none">
      <Spinner size="lg" />
      <p className="text-sm font-semibold text-muted-foreground animate-pulse">
        Loading console...
      </p>
    </div>
  );
};

// StatCardSkeleton component
export const StatCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3.5 w-40" />
        </div>
      </CardContent>
    </Card>
  );
};

// CardSkeleton component
export const CardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3.5 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
};

// TableSkeleton component
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <TableWrapper>
        <Table>
          <TableHead>
            <TableRow>
              {Array.from({ length: cols }).map((_, idx) => (
                <TableHeader key={idx}>
                  <Skeleton className="h-4 w-16" />
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <TableRow key={rIdx}>
                {Array.from({ length: cols }).map((_, cIdx) => (
                  <TableCell key={cIdx}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  );
};
