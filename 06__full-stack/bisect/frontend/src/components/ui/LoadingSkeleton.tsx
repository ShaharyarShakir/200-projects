"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3 w-full animate-pulse" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={cn("h-8 rounded-lg bg-slate-800/60", className)}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-slate-800 bg-[#0f172a] p-6 space-y-4",
        className
      )}
      aria-busy="true"
      aria-label="Loading card"
    >
      <div className="flex items-center justify-between">
        <div className="h-6 w-1/3 rounded bg-slate-800" />
        <div className="h-6 w-20 rounded-full bg-slate-800" />
      </div>
      <div className="h-16 w-full rounded-lg bg-slate-800/50" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="h-14 rounded-lg bg-slate-800/40" />
        <div className="h-14 rounded-lg bg-slate-800/40" />
        <div className="h-14 rounded-lg bg-slate-800/40" />
        <div className="h-14 rounded-lg bg-slate-800/40" />
      </div>
    </div>
  );
}
