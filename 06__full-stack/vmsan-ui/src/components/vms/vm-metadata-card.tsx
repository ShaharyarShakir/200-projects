import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { formatDate, formatValue } from "@/lib/utils/formatters";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Layers, Hash } from "lucide-react";

export interface VmMetadataCardProps extends React.ComponentProps<typeof Card> {
  vm: ClientVM;
}

export function VmMetadataCard({ vm, className, ...props }: VmMetadataCardProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">
          Metadata & Environment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Created At */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="size-4 text-primary/80" aria-hidden="true" />
              <span>Created At</span>
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
              {formatDate(vm.createdAt)}
            </span>
          </div>

          {/* Age */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock className="size-4 text-primary/80" aria-hidden="true" />
              <span>Uptime / Age</span>
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
              {formatValue(vm.age)}
            </span>
          </div>

          {/* Runtime Environment */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Layers className="size-4 text-primary/80" aria-hidden="true" />
              <span>Runtime Image</span>
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
              {formatValue(vm.runtime)}
            </span>
          </div>

          {/* Identifier */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Hash className="size-4 text-primary/80" aria-hidden="true" />
              <span>VM Identifier</span>
            </div>
            <span className="truncate font-mono text-sm font-semibold tracking-tight text-foreground" title={vm.id}>
              {formatValue(vm.id)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
