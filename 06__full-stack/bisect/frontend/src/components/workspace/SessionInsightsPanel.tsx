"use client";

import {
  AgentSession,
  SessionEvent,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { formatAbsoluteTime } from "@/lib/session-format";
import {
  deriveCurrentOperation,
  deriveLifecycle,
  deriveSessionIssues,
  deriveValidationState,
  VALIDATION_LABEL,
  type ValidationState,
} from "@/lib/session-insights";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Loader2,
  ShieldQuestion,
} from "lucide-react";

interface SessionInsightsPanelProps {
  session: AgentSession | null;
  events: SessionEvent[];
  isLoading?: boolean;
  error?: string | null;
}

const VALIDATION_CLASS: Record<ValidationState, string> = {
  not_run: "border-slate-700 bg-slate-800/60 text-slate-300",
  validating: "border-blue-800/60 bg-blue-950/40 text-blue-300",
  passed: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  issues: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  failed: "border-rose-800/60 bg-rose-950/40 text-rose-300",
};

const VALIDATION_ICON: Record<ValidationState, typeof CheckCircle2> = {
  not_run: ShieldQuestion,
  validating: Loader2,
  passed: CheckCircle2,
  issues: AlertTriangle,
  failed: AlertCircle,
};

/**
 * What the backend knows about a run: where it is, what it is doing, what went
 * wrong, and whether its output was accepted.
 *
 * Every value here comes from the persisted session and its recorded events
 * rather than from a client-side guess about the status.
 */
export function SessionInsightsPanel({
  session,
  events,
  isLoading = false,
  error = null,
}: SessionInsightsPanelProps) {
  // Explicit state per condition rather than a silent null: a panel that vanishes
  // is indistinguishable from one that failed to render.
  if (error && !session) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-rose-800/60 bg-rose-950/20 p-4"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
        <div>
          <h3 className="text-sm font-semibold text-rose-200">
            Could not load run status
          </h3>
          <p className="mt-0.5 text-xs text-rose-300/80">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="animate-pulse rounded-xl border border-slate-800 bg-[#0f172a] p-6"
      >
        <div className="h-5 w-1/3 rounded bg-slate-800" />
        <div className="mt-4 h-4 w-2/3 rounded bg-slate-800/50" />
        <div className="mt-4 h-16 w-full rounded bg-slate-800/40" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-[#0f172a]/40 p-6 text-center">
        <ShieldQuestion className="mx-auto h-6 w-6 text-slate-600" />
        <h3 className="mt-2 text-sm font-semibold text-slate-400">
          No run to inspect
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Start a task to see its status, validation, and lifecycle here.
        </p>
      </div>
    );
  }

  const validation = deriveValidationState(session, events);
  const issues = deriveSessionIssues(events);
  const currentOperation = deriveCurrentOperation(session, events);
  const lifecycle = deriveLifecycle(session, events);
  const ValidationIcon = VALIDATION_ICON[validation];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
        <Activity className="h-5 w-5 text-blue-400" />
        <h3 className="text-base font-semibold text-slate-100">
          Run Status &amp; Validation
        </h3>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase",
            VALIDATION_CLASS[validation]
          )}
        >
          <ValidationIcon
            className={cn("h-3 w-3", validation === "validating" && "animate-spin")}
          />
          {VALIDATION_LABEL[validation]}
        </span>
      </div>

      {/* Current operation */}
      <div className="mt-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Current Operation
        </span>
        <p className="mt-1 text-sm text-slate-200">
          {currentOperation ?? "No operation in progress"}
        </p>
      </div>

      {/* Timestamps */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Timestamp label="Created" value={session.created_at} />
        <Timestamp label="Started" value={session.started_at} />
        <Timestamp label="Finished" value={session.completed_at} />
      </div>

      {/* Lifecycle */}
      <div className="mt-5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Lifecycle
        </span>
        <ol className="mt-2 space-y-1.5">
          {lifecycle.map((milestone) => (
            <li
              key={milestone.key}
              className="flex items-center gap-2 text-xs"
              data-reached={milestone.reached}
            >
              {milestone.reached ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <CircleDashed className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              )}
              <span
                className={cn(
                  milestone.reached ? "text-slate-200" : "text-slate-500"
                )}
              >
                {milestone.label}
              </span>
              {milestone.reached && milestone.at && (
                <span className="ml-auto font-mono text-[10px] text-slate-500">
                  {formatAbsoluteTime(milestone.at)}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Errors and warnings */}
      <div className="mt-5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Errors &amp; Warnings
        </span>
        {issues.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500">
            No errors or warnings recorded.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {issues.map((issue) => (
              <li
                key={`${issue.eventType}-${issue.sequence}`}
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-2.5 text-xs",
                  issue.category === "error"
                    ? "border-rose-800/60 bg-rose-950/20 text-rose-200"
                    : "border-amber-800/60 bg-amber-950/20 text-amber-200"
                )}
              >
                {issue.category === "error" ? (
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium">{issue.summary}</p>
                  {issue.detail && (
                    <p className="mt-0.5 break-words font-mono text-[11px] opacity-80">
                      {issue.detail}
                    </p>
                  )}
                  <p className="mt-0.5 font-mono text-[10px] opacity-60">
                    seq {issue.sequence} · {issue.eventType}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Timestamp({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <p
        className={cn(
          "mt-0.5 font-mono text-xs",
          value ? "text-slate-200" : "text-slate-500"
        )}
      >
        {formatAbsoluteTime(value)}
      </p>
    </div>
  );
}
