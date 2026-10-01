"use client";

import * as React from "react";
import { RefreshCw, Server, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VMList } from "./vm-list";
import { VMErrorState } from "./vm-error-state";
import { CreateVMDialog } from "./create-vm-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getVMs } from "@/lib/api/vms";
import { formatVmCount } from "@/lib/utils/formatters";
import type { ClientVM } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface VMDashboardProps extends React.ComponentProps<"div"> {
  initialVMs?: ClientVM[];
  fetchVMsFn?: () => Promise<ClientVM[]>;
  onStart?: (id: string) => Promise<unknown> | unknown;
  onStop?: (id: string) => Promise<unknown> | unknown;
  onDelete?: (id: string) => Promise<unknown> | unknown;
}

export function VMDashboard({
  initialVMs,
  fetchVMsFn = getVMs,
  onStart,
  onStop,
  onDelete,
  className,
  ...props
}: VMDashboardProps) {
  const [vms, setVms] = React.useState<ClientVM[]>(initialVMs ?? []);
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialVMs);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | Error | null>(null);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await fetchVMsFn();
      setVms(data);
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchVMsFn]);

  const handleRetry = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchVMsFn();
      setVms(data);
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [fetchVMsFn]);

  React.useEffect(() => {
    if (initialVMs) return;

    let ignore = false;
    async function fetchInitial() {
      try {
        const data = await fetchVMsFn();
        if (!ignore) {
          setVms(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          setError(errorObj);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void fetchInitial();

    return () => {
      ignore = true;
    };
  }, [initialVMs, fetchVMsFn]);

  const totalCountText = isLoading ? "Loading VMs..." : formatVmCount(vms.length);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Top Application Bar */}
      <header className="flex flex-col gap-4 border-b border-border/40 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Server className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">vmsan</h1>
            <p className="text-xs text-muted-foreground">Firecracker microVM management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <CreateVMDialog onSuccess={handleRefresh} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="gap-1.5 cursor-pointer border-border/80 hover:border-primary/40"
            aria-label="Refresh virtual machines"
          >
            <RefreshCw
              className={cn("size-3.5", (isRefreshing || isLoading) && "animate-spin")}
              aria-hidden="true"
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </header>

      {/* Main Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Virtual Machines</h2>
          <p className="text-sm text-muted-foreground">{totalCountText}</p>
        </div>
      </div>

      {/* Error Notice when previous data exists */}
      {error && vms.length > 0 && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span>
              {error instanceof Error ? error.message : String(error)} — Retaining previous snapshot.
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 px-2 text-xs hover:bg-destructive/10 text-destructive"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Content Body */}
      {error && vms.length === 0 ? (
        <VMErrorState
          error={error}
          onRetry={handleRetry}
          isRetrying={isLoading || isRefreshing}
        />
      ) : (
        <VMList
          vms={vms}
          isLoading={isLoading}
          onStart={onStart}
          onStop={onStop}
          onDelete={onDelete}
          onRefresh={handleRefresh}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
