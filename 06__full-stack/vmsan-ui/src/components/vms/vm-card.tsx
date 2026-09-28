import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { VMStatusBadge } from "./vm-status-badge";
import { formatValue, formatMemory } from "@/lib/utils/formatters";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Cpu, HardDrive, Layers, Clock } from "lucide-react";

export interface VMCardProps extends React.ComponentProps<typeof Card> {
  vm: ClientVM;
}

export function VMCard({ vm, className, ...props }: VMCardProps) {
  return (
    <Card className={cn("transition-all hover:border-foreground/20", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-mono text-base tracking-tight truncate max-w-[200px]" title={vm.id}>
          {vm.id}
        </CardTitle>
        <CardAction>
          <VMStatusBadge status={vm.status} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-2.5">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Layers className="size-3.5" aria-hidden="true" />
              Runtime
            </span>
            <span className="font-semibold text-foreground font-mono truncate">
              {formatValue(vm.runtime)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-2.5">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Cpu className="size-3.5" aria-hidden="true" />
              vCPUs
            </span>
            <span className="font-semibold text-foreground font-mono">
              {formatValue(vm.vcpus)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-2.5">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <HardDrive className="size-3.5" aria-hidden="true" />
              Memory
            </span>
            <span className="font-semibold text-foreground font-mono">
              {formatMemory(vm.memoryMiB)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-2.5">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              Age
            </span>
            <span className="font-semibold text-foreground font-mono truncate">
              {formatValue(vm.age)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
