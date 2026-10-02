"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteVMDialog } from "./delete-vm-dialog";
import { formatDate, formatValue } from "@/lib/utils/formatters";
import { useOptionalVmConsole } from "./vm-console-context";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  Settings,
  Shield,
  Trash2,
  Loader2,
  AlertTriangle,
  Layers,
  Calendar,
  Hash,
} from "lucide-react";

export interface VmSettingsProps extends React.ComponentProps<"div"> {
  vm?: ClientVM;
  onDelete?: (id: string) => Promise<unknown> | unknown;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function VmSettings({
  vm: propVm,
  onDelete: propOnDelete,
  onNavigate,
  className,
  ...props
}: VmSettingsProps) {
  const consoleCtx = useOptionalVmConsole();
  const contextVm = consoleCtx?.vm ?? null;
  const contextDelete = consoleCtx?.deleteVm ?? null;

  const vm = propVm ?? contextVm;
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!vm) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (propOnDelete) {
        await propOnDelete(vm.id);
      } else if (contextDelete) {
        await contextDelete();
      }
      if (onNavigate) {
        onNavigate("/");
      } else if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/";
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Instance Configuration Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base font-semibold tracking-tight">
              Instance Configuration
            </CardTitle>
          </div>
          <CardDescription>
            System attributes and isolation configuration for this microVM instance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Hash className="size-4 text-primary/80" aria-hidden="true" />
                <span>Instance Identifier</span>
              </div>
              <span className="truncate font-mono text-sm font-semibold tracking-tight text-foreground" title={vm.id}>
                {formatValue(vm.id)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Layers className="size-4 text-primary/80" aria-hidden="true" />
                <span>Runtime Base Image</span>
              </div>
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
                {formatValue(vm.runtime)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar className="size-4 text-primary/80" aria-hidden="true" />
                <span>Provisioned At</span>
              </div>
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
                {formatDate(vm.createdAt)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Shield className="size-4 text-emerald-500" aria-hidden="true" />
                <span>Sandbox Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-xs font-mono">
                  Enforced (Jailer)
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
            <CardTitle className="text-base font-semibold tracking-tight">
              Danger Zone
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Irreversible actions that affect the lifecycle and persistence of this microVM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-background/80 p-4">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground text-sm">
                Delete this MicroVM
              </span>
              <span className="text-xs text-muted-foreground">
                Terminates the Firecracker process and permanently removes the root storage volume.
              </span>
            </div>

            <DeleteVMDialog
              vmId={vm.id}
              isLoading={isDeleting}
              onConfirm={handleDelete}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  className="gap-1.5 shrink-0"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      <span>Delete Instance</span>
                    </>
                  )}
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
