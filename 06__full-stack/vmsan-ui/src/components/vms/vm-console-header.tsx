"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VMStatusBadge } from "./vm-status-badge";
import { DeleteVMDialog } from "./delete-vm-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { formatValue } from "@/lib/utils/formatters";
import type { ClientVM, VMAction } from "@/lib/api/types";
import { startVM, stopVM, deleteVM } from "@/lib/api/vms";
import { cn } from "@/lib/utils";

export interface VmConsoleHeaderProps extends React.ComponentProps<"header"> {
  vm: ClientVM;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<unknown> | unknown;
  onStart?: (id: string) => Promise<unknown> | unknown;
  onStop?: (id: string) => Promise<unknown> | unknown;
  onDelete?: (id: string) => Promise<unknown> | unknown;
  onSuccess?: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function VmConsoleHeader({
  vm,
  isRefreshing = false,
  onRefresh,
  onStart,
  onStop,
  onDelete,
  onSuccess,
  onNavigate,
  className,
  ...props
}: VmConsoleHeaderProps) {
  const [actionState, setActionState] = React.useState<VMAction>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const isActionLoading = actionState !== null;

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
      // Fallback if clipboard writing fails
    }
  }, [vm.id]);

  const handleStart = React.useCallback(async () => {
    if (isActionLoading) return;
    setActionState("starting");
    setError(null);

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
  }, [isActionLoading, onStart, vm.id, onSuccess]);

  const handleStop = React.useCallback(async () => {
    if (isActionLoading) return;
    setActionState("stopping");
    setError(null);

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
  }, [isActionLoading, onStop, vm.id, onSuccess]);

  const handleDelete = React.useCallback(async () => {
    if (isActionLoading) return;
    setActionState("deleting");
    setError(null);

    try {
      if (onDelete) {
        await onDelete(vm.id);
      } else {
        await deleteVM(vm.id);
      }
      if (onNavigate) {
        onNavigate("/");
      } else if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setActionState(null);
    }
  }, [isActionLoading, onDelete, vm.id, onNavigate]);

  const handleRefreshClick = React.useCallback(async () => {
    if (isRefreshing || isActionLoading) return;
    setError(null);
    try {
      await onRefresh?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  }, [isRefreshing, isActionLoading, onRefresh]);

  return (
    <header className={cn("flex flex-col gap-4 border-b border-border/40 pb-5", className)} {...props}>
      {/* Top Bar: Back navigation & ThemeToggle */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
          )}
          aria-label="Back to Virtual Machines"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Virtual Machines</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Console Header Bar: Identity & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {vm.id}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground"
              aria-label={copied ? "Copied VM ID" : "Copy VM ID to clipboard"}
              title={copied ? "Copied!" : "Copy ID"}
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <VMStatusBadge status={vm.status} />
            <Badge variant="outline" className="gap-1 font-mono text-xs text-muted-foreground">
              <Layers className="size-3 text-muted-foreground/80" aria-hidden="true" />
              <span>{formatValue(vm.runtime)}</span>
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshClick}
              disabled={isRefreshing || isActionLoading}
              aria-label="Refresh VM data"
              className="gap-1.5 border-border/70"
            >
              <RefreshCw
                className={cn("size-3.5", isRefreshing && "animate-spin text-primary")}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </Button>
          )}

          {vm.status === "running" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStop}
              disabled={isActionLoading}
              aria-label={actionState === "stopping" ? "Stopping..." : "Stop microVM"}
              className="gap-1.5 border-border/70 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400"
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
              disabled={isActionLoading}
              aria-label={actionState === "starting" ? "Starting..." : "Start microVM"}
              className="gap-1.5 border-border/70 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400"
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
                aria-label={actionState === "deleting" ? "Deleting..." : "Delete microVM"}
                className="gap-1.5"
              >
                {actionState === "deleting" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
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
        </div>
      </div>

      {/* Error Alert if action failed */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </header>
  );
}
