"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityFeed } from "@/components/workspace/ActivityFeed";
import { getSession, listSessions } from "@/lib/api/sessions";
import { useSessionEvents } from "@/lib/hooks/useSessionEvents";
import { useAllSessionEvents } from "@/lib/hooks/useAllSessionEvents";
import { AgentSession } from "@/lib/api/types";
import { isTerminalStatus, statusLabel, shortSessionId } from "@/lib/session-format";
import { Activity, RefreshCw, ChevronDown, Layers } from "lucide-react";

/**
 * The activity timeline, for one session or across all of them.
 *
 * The aggregate mode is a backend filter rather than a second feed: the same
 * event read, widened to every session the caller owns, so each entry still
 * carries the session it came from. Sequence numbers restart per session, which
 * is why the merged view labels rows with their session and does not present the
 * sequences as one continuous range.
 *
 * The single-session mode keeps its original behaviour, including the
 * `after_sequence` cursor its poll uses.
 */
function ActivityContent() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessionIdParam
  );
  const [session, setSession] = useState<AgentSession | null>(null);
  const [sessionOptions, setSessionOptions] = useState<
    { id: string; label: string }[]
  >([]);

  // "all" merges every owned session; any other value follows that one session.
  // A direct link carrying ?session_id= therefore still lands on one run.
  const scope: "all" | "session" = selectedSessionId === "all" ? "all" : "session";
  const followedSessionId = scope === "all" ? null : selectedSessionId;

  // Terminal sessions record no further events, so polling stops there.
  const sessionResolved = session !== null;
  const isSessionTerminal = sessionResolved && isTerminalStatus(session.status);
  const { events, isLoading: isLoadingEvents, error: eventsError, refresh: refreshEvents } =
    useSessionEvents(followedSessionId, { enabled: !isSessionTerminal });

  const {
    events: allEvents,
    isLoading: isLoadingAllEvents,
    error: allEventsError,
    refresh: refreshAllEvents,
  } = useAllSessionEvents();

  const visibleEvents = scope === "all" ? allEvents : events;
  const visibleError = scope === "all" ? allEventsError : eventsError;
  const isVisibleLoading =
    scope === "all" ? isLoadingAllEvents : isLoadingEvents;

  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  // Offers the most recent sessions so the timeline can be pointed at one.
  useEffect(() => {
    listSessions({ limit: 25 })
      .then((response) => {
        setSessionOptions(
          response.items.map((item) => ({
            id: item.id,
            label: `${shortSessionId(item.id)} — ${item.task_prompt.slice(0, 60)}`,
          }))
        );
      })
      .catch(() => {
        // The picker is a convenience; the timeline still works via a direct link.
      });
  }, [reloadToken]);

  // The session header is read separately from the feed so a failing event load
  // still leaves the run's status and counters on screen. In aggregate mode there
  // is no single session to read, so it is skipped.
  useEffect(() => {
    if (!followedSessionId) {
      setSession(null);
      setIsLoadingSession(false);
      setSessionError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingSession(true);
    setSessionError(null);

    getSession(followedSessionId)
      .then((data) => {
        if (cancelled) return;
        setSession(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSession(null);
        setSessionError(
          err instanceof Error ? err.message : "Failed to load session"
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [followedSessionId, reloadToken]);

  const retry = useCallback(() => {
    setReloadToken((token) => token + 1);
    refreshEvents();
    refreshAllEvents();
  }, [refreshEvents, refreshAllEvents]);

  const selectedOption = useMemo(
    () => sessionOptions.find((option) => option.id === selectedSessionId),
    [sessionOptions, selectedSessionId]
  );

  // Resolves a session id to a readable label, falling back to a short id for a
  // session outside the loaded page of options.
  const sessionLabelFor = useCallback(
    (sessionId: string): string | undefined =>
      sessionOptions.find((option) => option.id === sessionId)?.label,
    [sessionOptions]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Activity
            </h1>
            <p className="text-sm text-slate-400">
              Execution events recorded by the backend, for one agent session or
              across all of them.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSessionId("all")}
              aria-pressed={scope === "all"}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                scope === "all"
                  ? "border-blue-500/60 bg-blue-600/20 text-blue-200"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              All sessions
            </button>

            <label className="relative">
              <span className="sr-only">Select a session</span>
              <select
                value={scope === "all" ? "all" : (selectedSessionId ?? "")}
                onChange={(e) => setSelectedSessionId(e.target.value || null)}
                aria-label="Select a session"
                className="max-w-xs appearance-none rounded-lg border border-slate-700 bg-slate-900 py-1.5 pl-3 pr-8 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">Select a session…</option>
                {sessionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </label>

            <button
              type="button"
              onClick={retry}
              disabled={isLoadingSession || (scope === "session" && !followedSessionId)}
              aria-label="Reload activity"
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingSession ? "animate-spin" : ""}`} />
              Reload
            </button>
          </div>
        </div>

        {scope === "all" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-[#0f172a] px-4 py-3 text-xs">
            <span className="font-mono font-bold text-blue-400">all sessions</span>
            <span className="text-slate-300">Merged, oldest first</span>
            <span className="text-slate-500">
              {visibleEvents.length} recorded{" "}
              {visibleEvents.length === 1 ? "event" : "events"}
            </span>
            <span className="text-slate-500">
              {new Set(visibleEvents.map((event) => event.session_id)).size}{" "}
              {new Set(visibleEvents.map((event) => event.session_id)).size === 1
                ? "session"
                : "sessions"}{" "}
              represented
            </span>
          </div>
        ) : (
          session && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-[#0f172a] px-4 py-3 text-xs">
              <span className="font-mono font-bold text-blue-400">
                {shortSessionId(session.id)}
              </span>
              <span className="text-slate-300">{statusLabel(session.status)}</span>
              <span className="text-slate-500">
                {session.iteration_count} iterations
              </span>
              <span className="text-slate-500">
                {visibleEvents.length} recorded{" "}
                {visibleEvents.length === 1 ? "event" : "events"}
              </span>
              {session.termination_reason && (
                <span className="text-slate-500">
                  ended: {session.termination_reason}
                </span>
              )}
            </div>
          )
        )}

        {scope === "all" ? (
          <ActivityFeed
            events={visibleEvents}
            isLoading={isVisibleLoading}
            error={visibleError}
            onRetry={retry}
            aggregate
            sessionLabelFor={sessionLabelFor}
          />
        ) : !followedSessionId ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
            <EmptyState
              icon={Activity}
              title="No Session Selected"
              description="Pick a session above to see the events it recorded, or switch to all sessions. Open the sessions archive to start from a specific run."
            />
          </div>
        ) : sessionError ? (
          <ActivityFeed events={[]} error={sessionError} onRetry={retry} />
        ) : isLoadingSession || isVisibleLoading ? (
          <ActivityFeed events={[]} isLoading />
        ) : visibleError ? (
          <ActivityFeed events={[]} error={visibleError} onRetry={retry} />
        ) : session && visibleEvents.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
            <EmptyState
              icon={Activity}
              title="No Events Recorded"
              description={`This session (${selectedOption?.label ?? shortSessionId(session.id)}) was created but has not recorded any events yet.`}
            />
          </div>
        ) : (
          <ActivityFeed events={visibleEvents} onRetry={retry} />
        )}
      </div>
    </AppShell>
  );
}

function ActivityPage() {
  return (
    <RequireAuth>
      <ActivityContent />
    </RequireAuth>
  );
}

export default ActivityPage;
