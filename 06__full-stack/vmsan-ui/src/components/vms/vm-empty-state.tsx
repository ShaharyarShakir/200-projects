import * as React from "react";
import { Server } from "lucide-react";
import { cn } from "@/lib/utils";

export type VMEmptyStateProps = React.ComponentProps<"div">;

export function VMEmptyState({ className, ...props }: VMEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-center",
        className
      )}
      {...props}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        <Server className="size-7" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No virtual machines found</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        There are currently no Firecracker microVMs configured or running in your environment.
      </p>
    </div>
  );
}
