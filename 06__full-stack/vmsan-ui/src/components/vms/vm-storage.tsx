"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDiskSize } from "@/lib/utils/formatters";
import { useOptionalVmConsole } from "./vm-console-context";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { HardDrive, Info, Database, Disc } from "lucide-react";

export interface VmStorageProps extends React.ComponentProps<"div"> {
  vm?: ClientVM;
  className?: string;
}

export function VmStorage({ vm: propVm, className, ...props }: VmStorageProps) {
  const consoleCtx = useOptionalVmConsole();
  const contextVm = consoleCtx?.vm ?? null;
  const vm = propVm ?? contextVm;

  if (!vm) {
    return null;
  }

  const disk = vm.diskSizeGb ?? vm.diskSizeGB;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Root Volume Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-base font-semibold tracking-tight">
                Root Storage Volume
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-xs font-mono">
              Attached
            </Badge>
          </div>
          <CardDescription>
            Primary root filesystem drive provisioned for this Firecracker microVM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Database className="size-4 text-primary/80" aria-hidden="true" />
                <span>Allocated Capacity</span>
              </div>
              <span className="font-mono text-xl font-bold tracking-tight text-foreground">
                {formatDiskSize(disk)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Disc className="size-4 text-primary/80" aria-hidden="true" />
                <span>Block Device</span>
              </div>
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
                /dev/vda
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <HardDrive className="size-4 text-primary/80" aria-hidden="true" />
                <span>Filesystem</span>
              </div>
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
                ext4
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Honest Telemetry Notice */}
      <div
        role="note"
        aria-label="Storage telemetry notice"
        className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground"
      >
        <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">Disk Usage Telemetry</span>
          <span>
            Granular live disk usage information (used/free bytes) is currently unavailable from the host manager daemon API.
            Storage capacity reflects the virtual block device allocation configured during VM creation.
          </span>
        </div>
      </div>
    </div>
  );
}
