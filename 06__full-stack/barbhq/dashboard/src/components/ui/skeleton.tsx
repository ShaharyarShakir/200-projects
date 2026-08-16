import React from "react";
import { cn } from "../../lib/utils";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-muted/60 dark:bg-muted/40",
        className,
      )}
      {...props}
    />
  );
};
