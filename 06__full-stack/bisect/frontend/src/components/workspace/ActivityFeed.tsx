"use client";

import { useState } from "react";
import {
  CommandActionResult,
  InspectFileActionResult,
  SessionEvent,
  SessionEventCategory,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { formatAbsoluteTime, shortSessionId } from "@/lib/session-format";
import {
  ChevronDown,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Terminal,
  Code,
} from "lucide-react";

interface ActivityFeedProps {
  events: SessionEvent[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /**
   * Render a feed merged from more than one session.
   *
   * `sequence` is a per-session counter, so a merged feed must not present it as
   * one continuous range, and each row needs to say which session it came from or
   * the entries are unattributable. Both are wrong in single-session mode, so
   * the default is off.
   */
  aggregate?: boolean;
  /** Resolves a session id to a label; falls back to a short id when absent. */
  sessionLabelFor?: (sessionId: string) => string | undefined;
}

const CATEGORY_LABEL: Record<SessionEventCategory, string> = {
  system: "System",
  agent: "Agent",
  execution: "Execution",
  validation: "Validation",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

const CATEGORY_CLASS: Record<SessionEventCategory, string> = {
  system: "border-slate-700 bg-slate-800/60 text-slate-300",
  agent: "border-violet-800/60 bg-violet-950/40 text-violet-300",
  execution: "border-blue-800/60 bg-blue-950/40 text-blue-300",
  validation: "border-cyan-800/60 bg-cyan-950/40 text-cyan-300",
  success: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  warning: "border-amber-800/60 bg-amber-950/40 text-amber-300",
  error: "border-rose-800/60 bg-rose-950/40 text-rose-300",
};

const CATEGORY_ICON: Record<SessionEventCategory, typeof Info> = {
  system: Info,
  agent: Activity,
  execution: Terminal,
  validation: CheckCircle2,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

/**
 * Renders the persisted event feed for one session.
 *
 * The backend derives each event's `category` and `level` server-side, so this
 * component branches on those instead of re-deriving a category from step
 * internals. That keeps the browser from second-guessing the server and means a
 * new event type renders sensibly without a change here.
 */
export function ActivityFeed({
  events,
  isLoading = false,
  error = null,
  onRetry,
  aggregate = false,
  sessionLabelFor,
}: ActivityFeedProps) {
  // Keyed by event id, not sequence: `sequence` restarts at 1 in every session,
  // so keying on it would make one row's expand state toggle another row's in a
  // merged feed.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (eventId: string) => {
    setExpanded((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-rose-800/60 bg-rose-950/30 p-6"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-rose-200">
            Could not load activity
          </h3>
          <p className="text-xs text-rose-300/80">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-rose-800/60 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-900/40"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="space-y-4 rounded-xl border border-slate-800 bg-[#0f172a] p-6 animate-pulse"
      >
        <span className="sr-only">Loading events…</span>
        <div className="h-6 w-1/4 rounded bg-slate-800" />
        <div className="h-24 w-full rounded bg-slate-800/50" />
        <div className="h-24 w-full rounded bg-slate-800/50" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0f172a]/40 p-8 text-center">
        <Terminal className="h-8 w-8 text-slate-500" />
        <h3 className="mt-3 text-sm font-semibold text-slate-300">
          {aggregate ? "No Activity Across Sessions" : "No Activity Recorded"}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          {aggregate
            ? "None of your sessions have recorded any events yet. Start a task from the workspace to see execution events appear here."
            : "This session has not recorded any events yet. Start a task from the workspace to see execution events appear here."}
        </p>
      </div>
    );
  }

  const first = events[0];
  const last = events[events.length - 1];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-blue-400" />
          <h3 className="text-base font-semibold text-slate-100">
            {aggregate ? "All Sessions Activity" : "Activity & Execution Feed"}
          </h3>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
        </div>
        {/* Only meaningful within one session: across sessions the numbers
            restart, so a range would imply an order that does not exist. */}
        {!aggregate && (
          <span className="font-mono text-[10px] text-slate-500">
            seq {first.sequence}–{last.sequence}
          </span>
        )}
      </div>

      <ol className="mt-6 space-y-3">
        {events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            isExpanded={expanded[event.id] ?? false}
            onToggle={() => toggle(event.id)}
            aggregate={aggregate}
            sessionLabelFor={sessionLabelFor}
          />
        ))}
      </ol>
    </div>
  );
}

function EventRow({
  event,
  isExpanded,
  onToggle,
  aggregate = false,
  sessionLabelFor,
}: {
  event: SessionEvent;
  isExpanded: boolean;
  onToggle: () => void;
  aggregate?: boolean;
  sessionLabelFor?: (sessionId: string) => string | undefined;
}) {
  const Icon = CATEGORY_ICON[event.category];
  const payload = event.payload ?? null;
  const hasDetails =
    Boolean(payload && Object.keys(payload).length > 0) ||
    isCommandResult(event) ||
    isInspectResult(event);

  // Falls back to the short id so a merged row is always attributable, even for
  // a session outside the loaded page of options.
  const sessionLabel = aggregate
    ? (sessionLabelFor?.(event.session_id) ?? shortSessionId(event.session_id))
    : null;

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900/60">
      <div
        className={cn(
          "flex items-start justify-between gap-3 p-4",
          hasDetails && "cursor-pointer"
        )}
        onClick={hasDetails ? onToggle : undefined}
        onKeyDown={
          hasDetails
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle();
                }
              }
            : undefined
        }
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        aria-expanded={hasDetails ? isExpanded : undefined}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 font-mono text-xs font-bold text-slate-400">
            {event.sequence}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {sessionLabel && (
                <span
                  title={event.session_id}
                  className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                >
                  {sessionLabel}
                </span>
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  CATEGORY_CLASS[event.category]
                )}
              >
                <Icon className="h-3 w-3" />
                {CATEGORY_LABEL[event.category]}
              </span>
              <span className="font-mono text-[10px] uppercase text-slate-500">
                {event.event_type}
              </span>
              {event.level === "error" && (
                <span className="rounded bg-rose-950/60 px-1.5 py-0.5 font-mono text-[10px] text-rose-300">
                  {event.level}
                </span>
              )}
            </div>
            <p
              className={cn(
                "mt-1 text-sm",
                event.category === "error"
                  ? "text-rose-200"
                  : "text-slate-200"
              )}
            >
              {event.summary}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className="whitespace-nowrap font-mono text-[10px] text-slate-500"
            title={formatAbsoluteTime(event.created_at)}
          >
            {formatAbsoluteTime(event.created_at)}
          </span>
          {hasDetails &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            ))}
        </div>
      </div>

      {isExpanded && hasDetails && <EventDetails event={event} />}
    </li>
  );
}

function EventDetails({ event }: { event: SessionEvent }) {
  const payload = event.payload;
  if (!payload || Object.keys(payload).length === 0) {
    return null;
  }

  const commandResult = commandResultOf(event);
  const inspectResult = inspectResultOf(event);

  return (
    <div className="space-y-3 border-t border-slate-800/80 p-4 text-xs">
      {payload.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-800/60 bg-red-950/30 p-3 text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Execution Error</p>
            <p className="mt-0.5 font-mono">{payload.error}</p>
          </div>
        </div>
      )}

      {commandResult && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded px-2 py-0.5 font-mono text-[10px] font-semibold",
                commandResult.exit_code === 0
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                  : "bg-red-950/60 text-red-300 border border-red-800/60"
              )}
            >
              Exit Code: {commandResult.exit_code}
            </span>
            {commandResult.timed_out && (
              <span className="rounded border border-amber-800/60 bg-amber-950/60 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                Timed Out
              </span>
            )}
            <span className="font-mono text-[10px] text-slate-500">
              {commandResult.duration_seconds.toFixed(2)}s
            </span>
          </div>

          {commandResult.stdout && (
            <div>
              <span className="font-medium text-slate-400">
                Standard Output:
              </span>
              <pre className="mt-1 max-h-48 overflow-x-auto rounded-lg border border-slate-800 bg-black/60 p-3 font-mono text-slate-300 whitespace-pre-wrap">
                {commandResult.stdout}
              </pre>
            </div>
          )}

          {commandResult.stderr && (
            <div>
              <span className="font-medium text-red-400">Standard Error:</span>
              <pre className="mt-1 max-h-48 overflow-x-auto rounded-lg border border-red-900/40 bg-red-950/20 p-3 font-mono text-red-300 whitespace-pre-wrap">
                {commandResult.stderr}
              </pre>
            </div>
          )}
        </div>
      )}

      {inspectResult && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <span>
              Exists:{" "}
              <strong className="text-slate-200">
                {inspectResult.exists ? "Yes" : "No"}
              </strong>
            </span>
            {inspectResult.size_bytes !== undefined &&
              inspectResult.size_bytes !== null && (
                <span>
                  Size:{" "}
                  <strong className="text-slate-200">
                    {inspectResult.size_bytes} bytes
                  </strong>
                </span>
              )}
          </div>

          {inspectResult.content && (
            <div>
              <span className="font-medium text-slate-400">File Content:</span>
              <pre className="mt-1 max-h-48 overflow-x-auto rounded-lg border border-slate-800 bg-black/60 p-3 font-mono text-slate-300 whitespace-pre-wrap">
                {inspectResult.content}
              </pre>
            </div>
          )}
        </div>
      )}

      {payload.message && (
        <div>
          <span className="font-medium text-slate-400">Message:</span>
          <p className="mt-1 font-mono text-slate-300">{payload.message}</p>
        </div>
      )}

      {payload.final_message && (
        <div>
          <span className="font-medium text-slate-400">Final Message:</span>
          <p className="mt-1 text-slate-300">{payload.final_message}</p>
        </div>
      )}

      {payload.total_tokens !== undefined && (
        <div className="flex flex-wrap gap-4 text-slate-400">
          <span>
            Prompt:{" "}
            <strong className="text-slate-200">{payload.prompt_tokens ?? 0}</strong>
          </span>
          <span>
            Completion:{" "}
            <strong className="text-slate-200">
              {payload.completion_tokens ?? 0}
            </strong>
          </span>
          <span>
            Total:{" "}
            <strong className="text-slate-200">{payload.total_tokens}</strong>
          </span>
        </div>
      )}

      <details className="pt-1">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300">
          <Code className="h-3.5 w-3.5" />
          View event payload
        </summary>
        <pre className="mt-2 max-h-64 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-slate-400 whitespace-pre-wrap">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/** Narrows an event's result to a command result without an `any` cast. */
function commandResultOf(event: SessionEvent): CommandActionResult | null {
  const result = event.payload?.result;
  if (result && result.action_type === "run_command") return result;
  return null;
}

function inspectResultOf(event: SessionEvent): InspectFileActionResult | null {
  const result = event.payload?.result;
  if (result && result.action_type === "inspect_file") return result;
  return null;
}

function isCommandResult(event: SessionEvent): boolean {
  return commandResultOf(event) !== null;
}

function isInspectResult(event: SessionEvent): boolean {
  return inspectResultOf(event) !== null;
}
