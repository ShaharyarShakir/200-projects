"use client";

import { AgentSession } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  Layers,
  Terminal,
  AlertTriangle,
} from "lucide-react";

interface SessionCardProps {
  session: AgentSession | null;
  isLoading?: boolean;
  /**
   * A failure to load the session.
   *
   * The prior session is deliberately still passed in when one exists: a failed
   * refresh should not erase the metrics the user was already reading.
   */
  error?: string | null;
  onRetry?: () => void;
}

export function SessionCard({
  session,
  isLoading = false,
  error = null,
  onRetry,
}: SessionCardProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="animate-pulse rounded-xl border border-slate-800 bg-[#0f172a] p-6"
      >
        <span className="sr-only">Loading session…</span>
        <div className="h-6 w-1/3 rounded bg-slate-800" />
        <div className="mt-4 h-16 w-full rounded bg-slate-800/60" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="h-14 rounded bg-slate-800/40" />
          <div className="h-14 rounded bg-slate-800/40" />
          <div className="h-14 rounded bg-slate-800/40" />
          <div className="h-14 rounded bg-slate-800/40" />
        </div>
      </div>
    );
  }

  // A failure with no session to fall back on is a standalone error state.
  // A failure with a session keeps that session visible alongside the error, so
  // a failed refresh never wipes metrics the user is already reading.
  if (error && !session) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center rounded-xl border border-rose-800/60 bg-rose-950/20 p-8 text-center"
      >
        <AlertTriangle className="h-8 w-8 text-rose-400" />
        <h3 className="mt-3 text-sm font-semibold text-rose-200">
          Could not load session
        </h3>
        <p className="mt-1 max-w-sm text-xs text-rose-300/80">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-md border border-rose-800/60 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-900/40"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0f172a]/40 p-8 text-center">
        <Activity className="h-8 w-8 text-slate-500" />
        <h3 className="mt-3 text-sm font-semibold text-slate-300">
          No Active Session Selected
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Select or trigger an agent session to inspect execution metrics, token
          consumption, and runtime status.
        </p>
      </div>
    );
  }

  // Calculate duration if timestamps exist
  const getDuration = () => {
    if (!session.started_at) return "0s";
    const start = new Date(session.started_at).getTime();
    const end = session.completed_at
      ? new Date(session.completed_at).getTime()
      : Date.now();
    const durationSeconds = Math.max(0, Math.round((end - start) / 1000));
    if (durationSeconds < 60) return `${durationSeconds}s`;
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "created":
        return "bg-amber-950/40 text-amber-300 border-amber-800/60";
      case "running":
        return "bg-blue-950/40 text-blue-300 border-blue-800/60 animate-pulse";
      case "completed":
        return "bg-emerald-950/40 text-emerald-300 border-emerald-800/60";
      case "failed":
        return "bg-red-950/40 text-red-300 border-red-800/60";
      case "terminated":
        return "bg-rose-950/40 text-rose-300 border-rose-800/60";
      case "timed_out":
        return "bg-orange-950/40 text-orange-300 border-orange-800/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-rose-800/60 bg-rose-950/30 p-2.5"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
          <div className="flex-1">
            <p className="text-xs text-rose-200">
              Showing the last known session — refresh failed: {error}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 rounded border border-rose-800/60 px-2 py-0.5 text-[11px] font-medium text-rose-200 hover:bg-rose-900/40"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}
      {/* Session Title & Status Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-blue-400" />
          <h3 className="text-base font-semibold text-slate-100">
            Session Inspector
          </h3>
          <span className="font-mono text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            {session.id}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
            getStatusBadge(session.status)
          )}
        >
          {session.status.toUpperCase().replace("_", " ")}
        </span>
      </div>

      {/* Task Prompt Section */}
      <div className="mt-4">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Task Prompt
        </span>
        <div className="mt-1.5 rounded-lg border border-slate-800/80 bg-slate-900/80 p-3.5 text-sm text-slate-200">
          <p className="whitespace-pre-wrap font-sans">{session.task_prompt}</p>
        </div>
      </div>

      {/* Execution & Consumption Metrics Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Iterations */}
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>Iterations</span>
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold text-slate-100">
            {session.iteration_count}
          </p>
        </div>

        {/* Executed Actions */}
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span>Actions Executed</span>
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold text-slate-100">
            {session.executed_action_count}
          </p>
        </div>

        {/* Duration */}
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Duration</span>
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold text-slate-100">
            {getDuration()}
          </p>
        </div>

        {/* Total Tokens */}
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Coins className="h-3.5 w-3.5 text-emerald-400" />
            <span>Total Tokens</span>
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold text-slate-100">
            {session.total_tokens.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500">
            {session.prompt_tokens.toLocaleString()} in /{" "}
            {session.completion_tokens.toLocaleString()} out
          </p>
        </div>
      </div>

      {/* Termination Reason Banner (if exists) */}
      {session.termination_reason ? (
        <div
          className={cn(
            "mt-4 flex items-start gap-2.5 rounded-lg border p-3.5 text-xs",
            session.status === "completed"
              ? "border-emerald-800/60 bg-emerald-950/20 text-emerald-300"
              : "border-rose-800/60 bg-rose-950/20 text-rose-300"
          )}
        >
          {session.status === "completed" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div>
            <span className="font-semibold">Termination Reason: </span>
            <span className="font-mono">{session.termination_reason}</span>
          </div>
        </div>
      ) : null}

      {/* Timestamps Footer */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created: {new Date(session.created_at).toLocaleTimeString()}</span>
        </div>
        {session.started_at ? (
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Started: {new Date(session.started_at).toLocaleTimeString()}</span>
          </div>
        ) : null}
        {session.completed_at ? (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              Completed: {new Date(session.completed_at).toLocaleTimeString()}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
