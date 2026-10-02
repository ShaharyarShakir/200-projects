"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { VmNetworkCard } from "./vm-network-card";
import { useOptionalVmConsole } from "./vm-console-context";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Sliders, Info } from "lucide-react";

export interface VmNetworkingProps extends React.ComponentProps<"div"> {
  vm?: ClientVM;
  className?: string;
}

export function VmNetworking({ vm: propVm, className, ...props }: VmNetworkingProps) {
  const consoleCtx = useOptionalVmConsole();
  const contextVm = consoleCtx?.vm ?? null;
  const vm = propVm ?? contextVm;

  if (!vm) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Current Network Configuration */}
      <VmNetworkCard vm={vm} />

      {/* Honest Interactive Networking Controls Placeholder */}
      <Card className="border-border/70 bg-muted/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base font-semibold tracking-tight text-muted-foreground">
              Interactive Network Management
            </CardTitle>
          </div>
          <CardDescription>
            Dynamic network policies and port forwarding rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="note"
            aria-label="Networking controls placeholder"
            className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground"
          >
            <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">Future Phase Feature</span>
              <span>
                Interactive network policy modification, live TAP device reconfiguration, and custom ingress/egress rules will be available in a future networking update.
                MicroVM network isolation is currently enforced at provisioning time.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
