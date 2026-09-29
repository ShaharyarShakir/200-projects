"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      className={cn("transition-all hover:border-foreground/20", className)}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle
          className="max-w-[200px] truncate font-mono text-base tracking-tight"
          title={vm.id}
        >
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
            <span className="truncate font-mono font-semibold text-foreground">
              {formatValue(vm.runtime)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-2.5">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Cpu className="size-3.5" aria-hidden="true" />
              vCPUs
            </span>
            <span className="font-mono font-semibold text-foreground">
              {formatValue(vm.vcpus)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-2.5">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <HardDrive className="size-3.5" aria-hidden="true" />
              Memory
            </span>
            <span className="font-mono font-semibold text-foreground">
              {formatMemory(vm.memoryMiB)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-2.5">
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              Age
            </span>
            <span className="truncate font-mono font-semibold text-foreground">
              {formatValue(vm.age)}
            </span>
          </div>
        </div>

        {/* Localized Error Notice */}
        {error && (
          <div
            role="alert"
            className="mt-3 flex items-center justify-between gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive"
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

      <CardFooter className="flex items-center justify-between gap-2">
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
              className="gap-1.5"
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
              className="gap-1.5"
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
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </Button>
          )}
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
              className="gap-1.5"
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
