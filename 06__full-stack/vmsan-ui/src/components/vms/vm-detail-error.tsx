import * as React from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export interface VmDetailErrorProps extends React.ComponentProps<typeof Card> {
  error: string;
  vmId?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function VmDetailError({
  error,
  vmId,
  onRetry,
  isRetrying = false,
  className,
  ...props
}: VmDetailErrorProps) {
  return (
    <Card
      role="alert"
      className={cn("mx-auto max-w-lg text-center p-6 border-destructive/30 bg-destructive/5", className)}
      {...props}
    >
      <CardHeader className="flex flex-col items-center gap-2 pb-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-destructive">
          Failed to load virtual machine
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground max-w-sm">
          {error ||
            (vmId
              ? `An unexpected error occurred while fetching virtual machine ${vmId}.`
              : "An unexpected error occurred while fetching virtual machine details.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw className={cn("size-4", isRetrying && "animate-spin")} aria-hidden="true" />
            <span>{isRetrying ? "Retrying..." : "Retry"}</span>
          </Button>
        )}
        <Link
          href="/"
          className={cn(buttonVariants({ variant: onRetry ? "secondary" : "default" }), "gap-2")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to Virtual Machines</span>
        </Link>
      </CardContent>
    </Card>
  );
}
