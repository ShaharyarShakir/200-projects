"use client";

import * as React from "react";
import {
  Terminal as TerminalIcon,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TerminalConnectionState } from "@/lib/api/terminal";

export interface VmTerminalHeaderProps extends React.ComponentProps<"div"> {
  vmId: string;
  status: TerminalConnectionState;
  isSudo?: boolean;
  onToggleSudo?: () => void;
  onReconnect?: () => void;
  onClear?: () => void;
  onCopy?: () => void;
  className?: string;
}

export function VmTerminalHeader({
  vmId,
  status,
  isSudo = false,
  onToggleSudo,
  onReconnect,
  onClear,
  onCopy,
  className,
  ...props
}: VmTerminalHeaderProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyClick = React.useCallback(async () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(vmId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback
      }
    }
  }, [onCopy, vmId]);

  return (
    <div
      data-testid="vm-terminal-header"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-zinc-100",
        className
      )}
      {...props}
    >
      {/* Identity & Status */}
      <div className="flex items-center gap-2.5">
        <TerminalIcon className="size-4 text-emerald-400" aria-hidden="true" />
        <span className="font-mono text-xs font-semibold tracking-tight text-zinc-200">
          Console
        </span>

        {vmId && (
          <Badge
            variant="outline"
            data-testid="vm-id-badge"
            className="border-zinc-700 bg-zinc-800/80 font-mono text-[11px] text-zinc-300"
          >
            {vmId}
          </Badge>
        )}

        {/* Dynamic Connection Status Indicator */}
        {status === "connected" && (
          <Badge
            variant="outline"
            data-testid="terminal-status-connected"
            className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 font-mono text-[11px] text-emerald-400"
          >
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected</span>
          </Badge>
        )}

        {status === "connecting" && (
          <Badge
            variant="outline"
            data-testid="terminal-status-connecting"
            className="gap-1.5 border-amber-500/40 bg-amber-500/10 font-mono text-[11px] text-amber-400"
          >
            <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Connecting...</span>
          </Badge>
        )}

        {status === "disconnected" && (
          <Badge
            variant="outline"
            data-testid="terminal-status-disconnected"
            className="gap-1.5 border-zinc-700 bg-zinc-800 font-mono text-[11px] text-zinc-400"
          >
            <span className="size-1.5 rounded-full bg-zinc-500" />
            <span>Disconnected</span>
          </Badge>
        )}

        {status === "error" && (
          <Badge
            variant="outline"
            data-testid="terminal-status-error"
            className="gap-1.5 border-rose-500/40 bg-rose-500/10 font-mono text-[11px] text-rose-400"
          >
            <span className="size-1.5 rounded-full bg-rose-400" />
            <span>Error</span>
          </Badge>
        )}
      </div>

      {/* Toolbar Actions */}
      <div className="flex items-center gap-1.5">
        {onToggleSudo && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onToggleSudo}
            aria-pressed={isSudo}
            className={cn(
              "h-7 gap-1.5 px-2.5 font-mono text-xs transition-colors border",
              isSudo
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
            title={
              isSudo
                ? "Administrative root shell active"
                : "Enable administrative root shell (sudo)"
            }
          >
            {isSudo ? (
              <ShieldCheck className="size-3.5 text-amber-400" aria-hidden="true" />
            ) : (
              <Shield className="size-3.5 text-zinc-400" aria-hidden="true" />
            )}
            <span>Sudo</span>
          </Button>
        )}

        {onReconnect && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onReconnect}
            className="h-7 gap-1 px-2 font-mono text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Reconnect terminal"
            title="Reconnect"
          >
            <RefreshCw
              className={cn("size-3.5", status === "connecting" && "animate-spin text-amber-400")}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Reconnect</span>
          </Button>
        )}

        {onClear && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClear}
            className="h-7 gap-1 px-2 font-mono text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Clear terminal"
            title="Clear"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleCopyClick}
          className="h-7 gap-1 px-2 font-mono text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          title="Copy"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
    </div>
  );
}
