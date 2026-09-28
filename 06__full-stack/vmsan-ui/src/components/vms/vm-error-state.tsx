import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VMErrorStateProps extends React.ComponentProps<"div"> {
  error?: string | Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function VMErrorState({
  error,
  onRetry,
  isRetrying = false,
  className,
  ...props
}: VMErrorStateProps) {
  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "Failed to fetch virtual machines from the server.";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-foreground",
        className
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
        <AlertCircle className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-destructive">Unable to load virtual machines</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{errorMessage}</p>

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", isRetrying && "animate-spin")} aria-hidden="true" />
            <span>{isRetrying ? "Retrying..." : "Retry"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
