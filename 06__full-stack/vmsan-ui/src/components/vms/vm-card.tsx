"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { VMStatusBadge } from "./vm-status-badge";
import { DeleteVMDialog } from "./delete-vm-dialog";
import { formatValue, formatMemory } from "@/lib/utils/formatters";
import type { ClientVM, VMAction } from "@/lib/api/types";
import { startVM, stopVM, deleteVM } from "@/lib/api/vms";
import { cn } from "@/lib/utils";
import {
  Cpu,
  HardDrive,
  Layers,
  Clock,
  Play,
  Square,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export interface VMCardProps extends React.ComponentProps<typeof Card> {
  vm: ClientVM;
  onStart?: (id: string) => Promise<unknown> | unknown;
  onStop?: (id: string) => Promise<unknown> | unknown;
  onDelete?: (id: string) => Promise<unknown> | unknown;
  onRefresh?: () => Promise<unknown> | unknown;
  onSuccess?: () => void;
}

export function VMCard({
  vm,
  onStart,
  onStop,
  onDelete,
  onRefresh,
  onSuccess,
  className,
  ...props
}: VMCardProps) {
  const [actionState, setActionState] = React.useState<VMAction>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [lastAction, setLastAction] = React.useState<
    "start" | "stop" | "delete" | "refresh" | null
  >(null);

  const isLoading = actionState !== null;

  const handleStart = React.useCallback(async () => {
    if (isLoading) return;
    setActionState("starting");
    setError(null);
    setLastAction("start");

    try {
      if (onStart) {
        await onStart(vm.id);
      } else {
        await startVM(vm.id);
      }
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setActionState(null);
    }
  }, [isLoading, onStart, vm.id, onSuccess]);

  const handleStop = React.useCallback(async () => {
    if (isLoading) return;
    setActionState("stopping");
    setError(null);
    setLastAction("stop");

    try {
      if (onStop) {
        await onStop(vm.id);
      } else {
        await stopVM(vm.id);
      }
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setActionState(null);
    }
  }, [isLoading, onStop, vm.id, onSuccess]);

  const handleDelete = React.useCallback(async () => {
    if (isLoading) return;
    setActionState("deleting");
    setError(null);
    setLastAction("delete");

    try {
      if (onDelete) {
        await onDelete(vm.id);
      } else {
        await deleteVM(vm.id);
      }
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setActionState(null);
    }
  }, [isLoading, onDelete, vm.id, onSuccess]);

  const handleRefresh = React.useCallback(async () => {
    if (isLoading) return;
    setError(null);
    setLastAction("refresh");

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        onSuccess?.();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  }, [isLoading, onRefresh, onSuccess]);

  const handleRetry = React.useCallback(() => {
    if (lastAction === "start") {
      void handleStart();
    } else if (lastAction === "stop") {
      void handleStop();
    } else if (lastAction === "delete") {
      void handleDelete();
    } else if (lastAction === "refresh") {
      void handleRefresh();
    }
  }, [lastAction, handleStart, handleStop, handleDelete, handleRefresh]);

  return (
    <Card
      className={cn(
        "group transition-all duration-200 border-border/70 bg-card text-card-foreground hover:border-primary/40 hover:shadow-md",
        className
      )}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle
          className="max-w-[200px] truncate font-mono text-sm sm:text-base font-semibold tracking-tight"
          title={vm.id}
        >
          <Link
            href={`/vms/${vm.id}`}
            className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors focus-visible:underline focus-visible:outline-none"
            aria-label={`View details for VM ${vm.id}`}
          >
            <span>{vm.id}</span>
            <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </CardTitle>
        <CardAction>
          <VMStatusBadge status={vm.status} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-muted/30 dark:bg-muted/20 p-2.5 transition-colors">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px]">
              <Layers className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
              Runtime
            </span>
            <span className="truncate font-mono font-semibold text-foreground text-xs">
              {formatValue(vm.runtime)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-muted/30 dark:bg-muted/20 p-2.5 transition-colors">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px]">
              <Cpu className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
              vCPUs
            </span>
            <span className="font-mono font-semibold text-foreground text-xs">
              {formatValue(vm.vcpus)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-muted/30 dark:bg-muted/20 p-2.5 transition-colors">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px]">
              <HardDrive className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
              Memory
            </span>
            <span className="font-mono font-semibold text-foreground text-xs">
              {formatMemory(vm.memoryMiB)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-muted/30 dark:bg-muted/20 p-2.5 transition-colors">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px]">
              <Clock className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
              Age
            </span>
            <span className="truncate font-mono font-semibold text-foreground text-xs">
              {formatValue(vm.age)}
            </span>
          </div>
        </div>

        {/* Localized Error Notice */}
        {error && (
          <div
            role="alert"
            className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{error}</span>
            </div>
            {lastAction && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleRetry}
                disabled={isLoading}
                className="h-6 shrink-0 px-1.5 text-xs text-destructive hover:bg-destructive/20"
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t border-border/30 pt-3">
        <div className="flex items-center gap-2">
          {vm.status === "running" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStop}
              disabled={isLoading}
              aria-label={
                actionState === "stopping" ? "Stopping..." : `Stop VM ${vm.id}`
              }
              className="gap-1.5 cursor-pointer border-border/80 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400"
            >
              {actionState === "stopping" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Stopping...</span>
                </>
              ) : (
                <>
                  <Square className="size-3.5 fill-current" aria-hidden="true" />
                  <span>Stop</span>
                </>
              )}
            </Button>
          )}

          {vm.status === "stopped" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStart}
              disabled={isLoading}
              aria-label={
                actionState === "starting" ? "Starting..." : `Start VM ${vm.id}`
              }
              className="gap-1.5 cursor-pointer border-border/80 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              {actionState === "starting" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                  <span>Start</span>
                </>
              )}
            </Button>
          )}

          {vm.status === "unknown" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label={`Refresh VM ${vm.id}`}
              className="gap-1.5 cursor-pointer border-border/80 hover:border-primary/40"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </Button>
          )}

          <Link
            href={`/vms/${vm.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            )}
            aria-label={`View details for VM ${vm.id}`}
          >
            <span>View Details</span>
          </Link>
        </div>

        <DeleteVMDialog
          vmId={vm.id}
          isLoading={actionState === "deleting"}
          onConfirm={handleDelete}
          trigger={
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isLoading}
              aria-label={
                actionState === "deleting"
                  ? "Deleting..."
                  : `Delete VM ${vm.id}`
              }
              className="gap-1.5 cursor-pointer border border-destructive/30"
            >
              {actionState === "deleting" ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>Delete</span>
                </>
              )}
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}
