import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VMCard } from "./vm-card";
import { VMEmptyState } from "./vm-empty-state";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function VMCardSkeleton({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <Skeleton className="h-5 w-28 rounded" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-2.5">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-2.5">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
          <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-2.5">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-2.5">
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface VMListSkeletonProps extends React.ComponentProps<"div"> {
  count?: number;
}

export function VMListSkeleton({ count = 6, className, ...props }: VMListSkeletonProps) {
  return (
    <div
      data-testid="vm-list-skeleton"
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <VMCardSkeleton key={index} />
      ))}
    </div>
  );
}

export interface VMListProps extends React.ComponentProps<"div"> {
  vms?: ClientVM[];
  isLoading?: boolean;
}

export function VMList({ vms = [], isLoading = false, className, ...props }: VMListProps) {
  if (isLoading) {
    return <VMListSkeleton className={className} />;
  }

  if (vms.length === 0) {
    return <VMEmptyState className={className} />;
  }

  return (
    <div
      data-testid="vm-list-grid"
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    >
      {vms.map((vm) => (
        <VMCard key={vm.id} vm={vm} />
      ))}
    </div>
  );
}
