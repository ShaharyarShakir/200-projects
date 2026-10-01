import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatValue } from "@/lib/utils/formatters";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Network, Globe, ArrowLeftRight } from "lucide-react";

export interface VmNetworkCardProps extends React.ComponentProps<typeof Card> {
  vm: ClientVM;
}

export function VmNetworkCard({ vm, className, ...props }: VmNetworkCardProps) {
  const network = vm.network;
  const policy = vm.networkPolicy ?? network?.policy;
  const ip = vm.ipAddress ?? network?.address ?? (network as unknown as { ip?: string })?.ip;
  const publishedPorts = vm.publishedPorts ?? network?.publishedPorts;

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">
          Network Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Network Policy */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Globe className="size-4 text-primary/80" aria-hidden="true" />
              <span>Network Policy</span>
            </div>
            <div className="flex items-center gap-2">
              {policy ? (
                <Badge
                  variant={
                    policy === "internet" || policy === "allow-all"
                      ? "default"
                      : policy === "local"
                      ? "secondary"
                      : "outline"
                  }
                  className="font-mono text-xs font-medium"
                >
                  {policy}
                </Badge>
              ) : (
                <span className="font-mono text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          {/* IP Address */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Network className="size-4 text-primary/80" aria-hidden="true" />
              <span>IP Address</span>
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
              {formatValue(ip)}
            </span>
          </div>

          {/* Published Ports */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ArrowLeftRight className="size-4 text-primary/80" aria-hidden="true" />
              <span>Published Ports</span>
            </div>
            {publishedPorts && publishedPorts.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {publishedPorts.map((mapping, idx) => {
                  if (typeof mapping === "string" || typeof mapping === "number") {
                    return (
                      <Badge
                        key={`${mapping}-${idx}`}
                        variant="outline"
                        className="font-mono text-xs py-0.5 px-2 bg-background/80"
                      >
                        {mapping}
                      </Badge>
                    );
                  }
                  return (
                    <Badge
                      key={`${mapping.hostPort}-${mapping.guestPort}-${idx}`}
                      variant="outline"
                      className="font-mono text-xs py-0.5 px-2 bg-background/80"
                    >
                      {mapping.hostPort}:{mapping.guestPort}
                      {mapping.protocol ? `/${mapping.protocol}` : ""}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <span className="font-mono text-sm text-muted-foreground">None</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
