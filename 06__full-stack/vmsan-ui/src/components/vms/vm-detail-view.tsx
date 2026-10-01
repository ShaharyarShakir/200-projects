"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { VmOverviewCard } from "./vm-overview-card";
import { VmTerminal } from "./vm-terminal";
import { VmResourcesCard } from "./vm-resources-card";
import { VmNetworkCard } from "./vm-network-card";
import { VmMetadataCard } from "./vm-metadata-card";
import { VmDetailSkeleton } from "./vm-detail-skeleton";
import { VmNotFound } from "./vm-not-found";
import { VmDetailError } from "./vm-detail-error";
import { getVM, startVM, stopVM, deleteVM, executeVmCommand } from "@/lib/api/vms";
import type {
  ClientVM,
  VMAction,
  ExecuteVmCommandRequest,
  ExecuteVmCommandResult,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface VmDetailViewProps extends React.ComponentProps<"div"> {
  id: string;
  initialVm?: ClientVM | null;
  fetchVmFn?: (id: string) => Promise<ClientVM>;
  onStart?: (id: string) => Promise<unknown> | unknown;
  onStop?: (id: string) => Promise<unknown> | unknown;
  onDelete?: (id: string) => Promise<unknown> | unknown;
  onExecuteCommand?: (
    id: string,
    options: ExecuteVmCommandRequest
  ) => Promise<ExecuteVmCommandResult>;
  onNavigate?: (path: string) => void;
}

export function VmDetailView({
  id,
  initialVm,
  fetchVmFn = getVM,
  onStart,
  onStop,
  onDelete,
  onExecuteCommand = executeVmCommand,
  onNavigate,
  className,
  ...props
}: VmDetailViewProps) {
  const [vm, setVm] = React.useState<ClientVM | null>(initialVm ?? null);
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialVm);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [isNotFound, setIsNotFound] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionState, setActionState] = React.useState<VMAction>(null);

  const isActionInProgress = actionState !== null;

  const fetchDetail = React.useCallback(async () => {
    try {
      const data = await fetchVmFn(id);
      setVm(data);
      setIsNotFound(false);
      setError(null);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const code = (err as { code?: string })?.code;
      const message = err instanceof Error ? err.message : String(err);

      if (status === 404 || code === "VM_NOT_FOUND" || message.toLowerCase().includes("not found")) {
        setIsNotFound(true);
      } else {
        setError(message);
      }
    }
  }, [id, fetchVmFn]);

  React.useEffect(() => {
    if (initialVm) return;

    let ignore = false;
    async function load() {
      setIsLoading(true);
      setIsNotFound(false);
      setError(null);

      try {
        const data = await fetchVmFn(id);
        if (!ignore) {
          setVm(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const status = (err as { status?: number })?.status;
          const code = (err as { code?: string })?.code;
          const message = err instanceof Error ? err.message : String(err);

          if (status === 404 || code === "VM_NOT_FOUND" || message.toLowerCase().includes("not found")) {
            setIsNotFound(true);
          } else {
            setError(message);
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [id, initialVm, fetchVmFn]);

  const handleRefresh = React.useCallback(async () => {
    if (isActionInProgress) return;
    setIsRefreshing(true);
    await fetchDetail();
    setIsRefreshing(false);
  }, [isActionInProgress, fetchDetail]);

  const handleStart = React.useCallback(async (vmId: string) => {
    if (isActionInProgress) return;
    setActionState("starting");
    setError(null);

    try {
      if (onStart) {
        await onStart(vmId);
      } else {
        await startVM(vmId);
      }
      await fetchDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setActionState(null);
    }
  }, [isActionInProgress, onStart, fetchDetail]);

  const handleStop = React.useCallback(async (vmId: string) => {
    if (isActionInProgress) return;
    setActionState("stopping");
    setError(null);

    try {
      if (onStop) {
        await onStop(vmId);
      } else {
        await stopVM(vmId);
      }
      await fetchDetail();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setActionState(null);
    }
  }, [isActionInProgress, onStop, fetchDetail]);

  const handleDelete = React.useCallback(async (vmId: string) => {
    if (isActionInProgress) return;
    setActionState("deleting");
    setError(null);

    try {
      if (onDelete) {
        await onDelete(vmId);
      } else {
        await deleteVM(vmId);
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
      throw err;
    } finally {
      setActionState(null);
    }
  }, [isActionInProgress, onDelete, onNavigate]);

  // Loading State
  if (isLoading) {
    return <VmDetailSkeleton className={className} {...props} />;
  }

  // Not Found State
  if (isNotFound) {
    return <VmNotFound vmId={id} className={className} {...props} />;
  }

  // Initial Fetch Error State (no VM loaded)
  if (error && !vm) {
    return (
      <VmDetailError
        error={error}
        vmId={id}
        onRetry={async () => {
          setIsLoading(true);
          await fetchDetail();
          setIsLoading(false);
        }}
        isRetrying={isLoading || isRefreshing}
        className={className}
        {...props}
      />
    );
  }

  if (!vm) {
    return <VmNotFound vmId={id} className={className} {...props} />;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Navigation & Action Header */}
      <header className="flex flex-col gap-4 border-b border-border/40 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isActionInProgress}
            className="gap-1.5 cursor-pointer border-border/80 hover:border-primary/40"
            aria-label={`Refresh VM ${vm.id}`}
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </header>

      {/* Global Error Notice if an action or refresh fails while VM is loaded */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setError(null)}
            className="h-6 px-1.5 text-xs hover:bg-destructive/20 text-destructive"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Overview & Lifecycle Card */}
      <VmOverviewCard
        vm={vm}
        actionState={actionState}
        isLoading={isActionInProgress}
        onStart={handleStart}
        onStop={handleStop}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
      />

      {/* Interactive Terminal Panel */}
      <VmTerminal
        vmId={vm.id}
        status={vm.status}
        onExecuteCommand={onExecuteCommand}
      />

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <VmResourcesCard vm={vm} />
        <VmNetworkCard vm={vm} />
      </div>

      {/* Metadata & Environment */}
      <VmMetadataCard vm={vm} />
    </div>
  );
}
