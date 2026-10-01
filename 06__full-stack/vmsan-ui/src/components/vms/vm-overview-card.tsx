"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VMStatusBadge } from "./vm-status-badge";
import { DeleteVMDialog } from "./delete-vm-dialog";
import { formatValue } from "@/lib/utils/formatters";
import type { ClientVM, VMAction } from "@/lib/api/types";
import { startVM, stopVM, deleteVM } from "@/lib/api/vms";
import { cn } from "@/lib/utils";
import {
  Copy,
  Check,
  Layers,
  Play,
  Square,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

export interface VmOverviewCardProps extends Omit<React.ComponentProps<typeof Card>, "onError"> {
  vm: ClientVM;
  actionState?: VMAction;
  isLoading?: boolean;
  onStart?: (id: string) => Promise<unknown> | unknown;
  onStop?: (id: string) => Promise<unknown> | unknown;
  onDelete?: (id: string) => Promise<unknown> | unknown;
  onRefresh?: () => Promise<unknown> | unknown;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function VmOverviewCard({
  vm,
  actionState: controlledActionState,
  isLoading: controlledIsLoading,
  onStart,
  onStop,
  onDelete,
  onRefresh,
  onSuccess,
  onError,
  className,
  ...props
}: VmOverviewCardProps) {
  const [internalActionState, setInternalActionState] = React.useState<VMAction>(null);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const actionState = controlledActionState !== undefined ? controlledActionState : internalActionState;
  const isActionLoading = controlledIsLoading !== undefined ? controlledIsLoading : actionState !== null;

  const handleCopy = React.useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(vm.id);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch {
      // Fallback for environments where clipboard write fails
    }
  }, [vm.id]);

  const handleStart = React.useCallback(async () => {
    if (isActionLoading) return;
    setInternalActionState("starting");
    setInternalError(null);

    try {
      if (onStart) {
        await onStart(vm.id);
      } else {
        await startVM(vm.id);
      }
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setInternalError(message);
      onError?.(message);
    } finally {
      setInternalActionState(null);
    }
  }, [isActionLoading, onStart, vm.id, onSuccess, onError]);

  const handleStop = React.useCallback(async () => {
    if (isActionLoading) return;
    setInternalActionState("stopping");
    setInternalError(null);

    try {
      if (onStop) {
        await onStop(vm.id);
      } else {
        await stopVM(vm.id);
      }
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setInternalError(message);
      onError?.(message);
    } finally {
      setInternalActionState(null);
    }
  }, [isActionLoading, onStop, vm.id, onSuccess, onError]);

  const handleDelete = React.useCallback(async () => {
    if (isActionLoading) return;
    setInternalActionState("deleting");
    setInternalError(null);

    try {
      if (onDelete) {
        await onDelete(vm.id);
      } else {
        await deleteVM(vm.id);
      }
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setInternalError(message);
      onError?.(message);
    } finally {
      setInternalActionState(null);
    }
  }, [isActionLoading, onDelete, vm.id, onSuccess, onError]);

  const handleRefresh = React.useCallback(async () => {
    if (isActionLoading) return;
    setInternalError(null);

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        onSuccess?.();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setInternalError(message);
      onError?.(message);
    }
  }, [isActionLoading, onRefresh, onSuccess, onError]);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 bg-card text-card-foreground shadow-xs",
        className
      )}
      {...props}
    >
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle
              className="truncate font-mono text-xl font-bold tracking-tight text-foreground"
              title={vm.id}
            >
              {vm.id}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleCopy}
              className="h-7 gap-1 px-2 font-sans text-xs text-muted-foreground hover:text-foreground cursor-pointer border-border/80"
              aria-label={copied ? "Copied VM ID" : "Copy VM ID"}
              title={copied ? "Copied!" : "Copy VM ID"}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" aria-hidden="true" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 font-normal bg-muted/60 dark:bg-muted/40">
              <Layers className="size-3" aria-hidden="true" />
              <span>Runtime: <strong className="font-mono text-foreground">{formatValue(vm.runtime)}</strong></span>
            </Badge>
          </div>
        </div>

        <CardAction className="flex items-center gap-2 shrink-0">
          <VMStatusBadge status={vm.status} className="text-sm px-2.5 py-1" />
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            {vm.status === "stopped" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStart}
                disabled={isActionLoading}
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

            {vm.status === "running" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={isActionLoading}
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

            {vm.status === "unknown" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isActionLoading}
                aria-label={`Refresh VM ${vm.id}`}
                className="gap-1.5 cursor-pointer border-border/80 hover:border-primary/40"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                <span>Refresh</span>
              </Button>
            )}
          </div>

          <div>
            <DeleteVMDialog
              vmId={vm.id}
              isLoading={actionState === "deleting"}
              onConfirm={handleDelete}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isActionLoading}
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
                      <span>Delete VM</span>
                    </>
                  )}
                </Button>
              }
            />
          </div>
        </div>

        {/* Localized Error Notice */}
        {internalError && (
          <div
            role="alert"
            className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{internalError}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setInternalError(null)}
              className="h-6 shrink-0 px-1.5 text-xs text-destructive hover:bg-destructive/20"
            >
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
