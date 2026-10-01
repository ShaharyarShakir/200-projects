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
import { executeVmCommand } from "@/lib/api/vms";
import type {
  ExecuteVmCommandRequest,
  ExecuteVmCommandResult,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  Terminal as TerminalIcon,
  Play,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Info,
} from "lucide-react";

export interface TerminalEntry {
  id: string;
  command: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs?: number;
  error?: string;
  status: "running" | "success" | "error" | "timed_out";
  timestamp: Date;
}

export interface VmTerminalProps extends React.ComponentProps<"div"> {
  vmId: string;
  status?: string;
  onExecuteCommand?: (
    id: string,
    options: ExecuteVmCommandRequest
  ) => Promise<ExecuteVmCommandResult>;
  initialHistory?: string[];
  initialEntries?: TerminalEntry[];
}

export function VmTerminal({
  vmId,
  status = "unknown",
  onExecuteCommand = executeVmCommand,
  initialHistory = [],
  initialEntries = [],
  className,
  ...props
}: VmTerminalProps) {
  const [entries, setEntries] = React.useState<TerminalEntry[]>(initialEntries);
  const [history, setHistory] = React.useState<string[]>(initialHistory);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);
  const [draftInput, setDraftInput] = React.useState<string>("");
  const [inputCommand, setInputCommand] = React.useState<string>("");
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false);

  const isRunning = status === "running";
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll output viewport to bottom as new entries or logs arrive
  React.useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [entries]);

  const handleClear = React.useCallback(() => {
    setEntries([]);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;

      if (historyIndex === -1) {
        setDraftInput(inputCommand);
        const nextIndex = history.length - 1;
        setHistoryIndex(nextIndex);
        setInputCommand(history[nextIndex]);
      } else if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputCommand(history[nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;

      if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInputCommand(history[nextIndex]);
      } else if (historyIndex === history.length - 1) {
        setHistoryIndex(-1);
        setInputCommand(draftInput);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const commandToRun = inputCommand.trim();
    if (!commandToRun || isExecuting || !isRunning) {
      return;
    }

    const entryId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: TerminalEntry = {
      id: entryId,
      command: commandToRun,
      status: "running",
      timestamp: new Date(),
    };

    setEntries((prev) => [...prev, newEntry]);
    setHistory((prev) => [...prev, commandToRun]);
    setHistoryIndex(-1);
    setDraftInput("");
    setInputCommand("");
    setIsExecuting(true);

    try {
      const result = await onExecuteCommand(vmId, { command: commandToRun });
      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.id !== entryId) return entry;
          return {
            ...entry,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            durationMs: result.durationMs,
            status: result.exitCode === 0 ? "success" : "error",
          };
        })
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout =
        message.toLowerCase().includes("timed out") ||
        message.toLowerCase().includes("timeout");

      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.id !== entryId) return entry;
          return {
            ...entry,
            error: message,
            status: isTimeout ? "timed_out" : "error",
          };
        })
      );
    } finally {
      setIsExecuting(false);
      // Re-focus input field
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <Card
      data-testid="vm-terminal-card"
      className={cn("overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100", className)}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="size-4 text-emerald-400" aria-hidden="true" />
          <CardTitle className="font-mono text-sm font-semibold tracking-tight text-zinc-100">
            Interactive Terminal
          </CardTitle>
          <Badge
            variant="outline"
            className="border-zinc-700 bg-zinc-800 font-mono text-[11px] text-zinc-300"
          >
            {vmId}
          </Badge>
        </div>

        <CardAction className="flex items-center gap-2">
          {isExecuting && (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] text-emerald-400"
            >
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              <span>Executing...</span>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleClear}
            className="h-7 gap-1 px-2 font-mono text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Clear terminal output"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            <span>Clear</span>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4">
        {/* Status Warning Banner when VM is not running */}
        {!isRunning && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"
          >
            <Info className="size-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span>
              MicroVM is not running (status: <strong className="font-mono">{status}</strong>).
              Start the microVM to execute interactive terminal commands.
            </span>
          </div>
        )}

        {/* Terminal Output Log Viewport */}
        <div
          ref={viewportRef}
          data-testid="terminal-output-viewport"
          tabIndex={0}
          role="log"
          aria-label="Terminal Output"
          className="flex min-h-[180px] max-h-[380px] flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
        >
          {entries.length === 0 ? (
            <div className="flex flex-col gap-1 py-4 text-center text-zinc-500">
              <p className="font-medium">
                {isRunning
                  ? "Terminal ready. Enter a command below and press Enter."
                  : "Terminal offline. MicroVM must be in running state."}
              </p>
              <p className="text-[11px] text-zinc-600">
                Commands execute safely inside the guest microVM sandbox.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1.5 border-b border-zinc-800/50 pb-2.5 last:border-b-0 last:pb-0">
                {/* Invocation Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="font-bold text-emerald-400 select-none">$</span>
                    <span className="text-zinc-100 font-semibold">{entry.command}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {entry.status === "running" && (
                      <span className="flex items-center gap-1 text-emerald-400 animate-pulse">
                        <Loader2 className="size-3 animate-spin" />
                        <span>Running</span>
                      </span>
                    )}

                    {entry.exitCode !== undefined && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-1.5 py-0 text-[10px] font-mono",
                          entry.exitCode === 0
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-rose-500/40 bg-rose-500/10 text-rose-400"
                        )}
                      >
                        exit {entry.exitCode}
                      </Badge>
                    )}

                    {entry.durationMs !== undefined && (
                      <span className="flex items-center gap-0.5 text-zinc-500">
                        <Clock className="size-3" />
                        <span>{entry.durationMs}ms</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Standard Output Stream */}
                {entry.stdout && (
                  <pre
                    data-testid="terminal-stdout"
                    className="overflow-x-auto rounded bg-zinc-950/80 p-2 font-mono text-xs text-zinc-200 border border-zinc-800/40 whitespace-pre-wrap"
                  >
                    {entry.stdout}
                  </pre>
                )}

                {/* Standard Error Stream */}
                {entry.stderr && (
                  <pre
                    data-testid="terminal-stderr"
                    className="overflow-x-auto rounded bg-rose-950/20 p-2 font-mono text-xs text-rose-300 border border-rose-900/30 whitespace-pre-wrap"
                  >
                    {entry.stderr}
                  </pre>
                )}

                {/* Execution Error or Timeout */}
                {entry.error && (
                  <div
                    data-testid="terminal-error"
                    className="flex items-center gap-1.5 rounded bg-rose-950/30 p-2 font-mono text-xs text-rose-400 border border-rose-900/40"
                  >
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{entry.error}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Command Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center">
            <span
              className={cn(
                "absolute left-3 font-mono text-sm font-bold select-none",
                isRunning ? "text-emerald-400" : "text-zinc-600"
              )}
              aria-hidden="true"
            >
              $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isRunning || isExecuting}
              placeholder={
                isRunning
                  ? "Enter shell command (e.g. uname -a, ps aux, ls -la)..."
                  : "Terminal disabled (MicroVM stopped)"
              }
              aria-label="Command prompt"
              className={cn(
                "h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/90 pl-7 pr-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-500",
                "focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50",
                "disabled:cursor-not-allowed disabled:bg-zinc-900/40 disabled:text-zinc-600 disabled:placeholder:text-zinc-700"
              )}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={!isRunning || isExecuting || !inputCommand.trim()}
            className="h-9 gap-1.5 bg-emerald-600 px-3.5 font-mono text-xs font-semibold text-white hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600"
            aria-label={isExecuting ? "Executing..." : "Run Command"}
          >
            {isExecuting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                <span>Running</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" aria-hidden="true" />
                <span>Run</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
