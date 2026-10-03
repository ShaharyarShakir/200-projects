"use client";

import * as React from "react";
import type {
  ClientVM,
  ExecuteVmCommandRequest,
  ExecuteVmCommandResult,
} from "@/lib/api/types";
import { getVM, startVM, stopVM, deleteVM, executeVmCommand } from "@/lib/api/vms";
import { VmConsoleHeader } from "./vm-console-header";
import { VmConsoleSidebar } from "./vm-console-sidebar";
import { VmDetailSkeleton } from "./vm-detail-skeleton";
import { VmNotFound } from "./vm-not-found";
import { VmDetailError } from "./vm-detail-error";
import { cn } from "@/lib/utils";

import {
  VmConsoleContext,
  useVmConsole,
  type VmConsoleContextValue,
} from "./vm-console-context";

export { VmConsoleContext, useVmConsole, type VmConsoleContextValue };

export interface VmConsoleLayoutClientProps extends React.ComponentProps<"div"> {
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
  children?: React.ReactNode;
}

export function VmConsoleLayoutClient({
  id,
  initialVm,
  fetchVmFn = getVM,
  onStart,
  onStop,
  onDelete,
  onExecuteCommand = executeVmCommand,
  onNavigate,
  children,
  className,
  ...props
}: VmConsoleLayoutClientProps) {
  const [vm, setVm] = React.useState<ClientVM | null>(initialVm ?? null);
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialVm);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [isNotFound, setIsNotFound] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

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

      if (
        status === 404 ||
        code === "VM_NOT_FOUND" ||
        message.toLowerCase().includes("not found")
      ) {
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

          if (
            status === 404 ||
            code === "VM_NOT_FOUND" ||
            message.toLowerCase().includes("not found")
          ) {
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
    setIsRefreshing(true);
    await fetchDetail();
    setIsRefreshing(false);
  }, [fetchDetail]);

  const handleStart = React.useCallback(async () => {
    if (onStart) {
      await onStart(id);
    } else {
      await startVM(id);
    }
    await fetchDetail();
  }, [id, onStart, fetchDetail]);

  const handleStop = React.useCallback(async () => {
    if (onStop) {
      await onStop(id);
    } else {
      await stopVM(id);
    }
    await fetchDetail();
  }, [id, onStop, fetchDetail]);

  const handleDelete = React.useCallback(async () => {
    if (onDelete) {
      await onDelete(id);
    } else {
      await deleteVM(id);
    }
    if (onNavigate) {
      onNavigate("/");
    } else if (typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    }
  }, [id, onDelete, onNavigate]);

  const handleExecuteCommand = React.useCallback(
    async (options: ExecuteVmCommandRequest) => {
      return onExecuteCommand(id, options);
    },
    [id, onExecuteCommand]
  );

  // Loading State
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <VmDetailSkeleton className={className} />
        </div>
      </main>
    );
  }

  // Not Found State
  if (isNotFound) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <VmNotFound vmId={id} className={className} />
        </div>
      </main>
    );
  }

  // Initial Fetch Error State (no VM loaded)
  if (error && !vm) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
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
          />
        </div>
      </main>
    );
  }

  if (!vm) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <VmNotFound vmId={id} className={className} />
        </div>
      </main>
    );
  }

  const contextValue: VmConsoleContextValue = {
    vm,
    isLoading,
    isRefreshing,
    error,
    refresh: handleRefresh,
    start: handleStart,
    stop: handleStop,
    deleteVm: handleDelete,
    executeCommand: handleExecuteCommand,
  };

  return (
    <VmConsoleContext.Provider value={contextValue}>
      <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className={cn("mx-auto max-w-7xl flex flex-col gap-6", className)} {...props}>
          <VmConsoleHeader
            vm={vm}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onStart={handleStart}
            onStop={handleStop}
            onDelete={handleDelete}
            onSuccess={handleRefresh}
            onNavigate={onNavigate}
          />
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <VmConsoleSidebar vmId={vm.id} />
            <div className="flex-1 min-w-0 w-full">{children}</div>
          </div>
        </div>
      </main>
    </VmConsoleContext.Provider>
  );
}
