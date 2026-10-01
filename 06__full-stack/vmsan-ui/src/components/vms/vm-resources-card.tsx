import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { formatValue, formatMemory, formatDiskSize } from "@/lib/utils/formatters";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Cpu, HardDrive, Database } from "lucide-react";

export interface VmResourcesCardProps extends React.ComponentProps<typeof Card> {
  vm: ClientVM;
}

export function VmResourcesCard({ vm, className, ...props }: VmResourcesCardProps) {
  const memory = vm.memoryMiB ?? vm.memoryMib;
  const disk = vm.diskSizeGB ?? vm.diskSizeGb;

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">
          Resource Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Cpu className="size-4 text-primary/80" aria-hidden="true" />
              <span>vCPUs</span>
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
              {formatValue(vm.vcpus)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <HardDrive className="size-4 text-primary/80" aria-hidden="true" />
              <span>Memory</span>
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
              {formatMemory(memory)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Database className="size-4 text-primary/80" aria-hidden="true" />
              <span>Disk Storage</span>
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
              {formatDiskSize(disk)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
