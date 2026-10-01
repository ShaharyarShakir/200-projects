import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type VmDetailSkeletonProps = React.ComponentProps<"div">;

export function VmDetailSkeleton({ className, ...props }: VmDetailSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading virtual machine details..."
      aria-busy="true"
      data-testid="vm-detail-skeleton"
      className={cn("space-y-6", className)}
      {...props}
    >
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Overview Card Skeleton */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border-t border-border/40 pt-4 flex items-center justify-between">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Grid of Resource & Network Skeletons */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Resources Card Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-36 rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Network Card Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-36 rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="col-span-1 sm:col-span-2 h-16 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Card Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-44 rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
