"use client";

import * as React from "react";
import Link from "next/link";
import { Terminal, Folder } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { VmResourcesCard } from "./vm-resources-card";
import { VmNetworkCard } from "./vm-network-card";
import { VmMetadataCard } from "./vm-metadata-card";
import { useOptionalVmConsole } from "./vm-console-context";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface VmOverviewProps extends React.ComponentProps<"div"> {
  vm?: ClientVM;
  className?: string;
}

export function VmOverview({ vm: propVm, className, ...props }: VmOverviewProps) {
  const consoleCtx = useOptionalVmConsole();
  const contextVm = consoleCtx?.vm ?? null;
  const vm = propVm ?? contextVm;

  if (!vm) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span>Quick Actions</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/vms/${vm.id}/terminal`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-xs font-medium"
            )}
          >
            <Terminal className="size-3.5" aria-hidden="true" />
            <span>Open Terminal</span>
          </Link>
          <Link
            href={`/vms/${vm.id}/files`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-xs font-medium"
            )}
          >
            <Folder className="size-3.5" aria-hidden="true" />
            <span>Browse Files</span>
          </Link>
        </div>
      </div>

      {/* Resource Allocation */}
      <VmResourcesCard vm={vm} />

      {/* Network Summary */}
      <VmNetworkCard vm={vm} />

      {/* Metadata & Environment */}
      <VmMetadataCard vm={vm} />
    </div>
  );
}
