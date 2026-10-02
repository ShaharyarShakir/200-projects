"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useOptionalVmConsole } from "./vm-console-context";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Camera, Info } from "lucide-react";

export interface VmSnapshotsProps extends React.ComponentProps<"div"> {
  vm?: ClientVM;
  className?: string;
}

export function VmSnapshots({ vm: propVm, className, ...props }: VmSnapshotsProps) {
  const consoleCtx = useOptionalVmConsole();
  const contextVm = consoleCtx?.vm ?? null;
  const vm = propVm ?? contextVm;

  if (!vm) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/70 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base font-semibold tracking-tight">
              MicroVM Snapshots
            </CardTitle>
          </div>
          <CardDescription>
            Point-in-time state capture and memory/disk restoration for Firecracker microVMs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="note"
            aria-label="Snapshots feature notice"
            className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground"
          >
            <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">Future Phase Feature</span>
              <span>
                Snapshot management, point-in-time memory dumps, and disk state rollback will be available in a future update.
                Firecracker microVM state capture is currently managed at the host system level.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
