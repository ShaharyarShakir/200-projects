"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/ui/EmptyState";
import { listSessions } from "@/lib/api/sessions";
import { listRepositories } from "@/lib/api/repositories";
import { AgentSession, SessionStatus } from "@/lib/api/types";
import {
  formatAbsoluteTime,
  formatDuration,
  formatRelativeTime,
  sessionDurationSeconds,
  shortSessionId,
  statusLabel,
  statusTone,
  type StatusTone,
} from "@/lib/session-format";
import {
  ListFilter,
  Layers,
  Search,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const PAGE_SIZE = 20;

/** Every status the backend can persist, so the filter cannot hide a real row. */
const STATUS_OPTIONS: SessionStatus[] = [
  "created",
  "running",
  "completed",
  "failed",
  "terminated",
  "timed_out",
];

const TONE_CLASS: Record<StatusTone, string> = {
  neutral:
    "border-slate-700 bg-slate-800/60 text-slate-300",
  active:
    "border-blue-800/60 bg-blue-950/40 text-blue-300 animate-pulse",
  success:
    "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
  danger:
    "border-rose-800/60 bg-rose-950/40 text-rose-300",
  warning:
    "border-amber-800/60 bg-amber-950/40 text-amber-300",
};

function StatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TONE_CLASS[statusTone(status)]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function SessionsContent() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "">("");
  const [repositoryFilter, setRepositoryFilter] = useState<string>("");

  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [repositoryNames, setRepositoryNames] = useState<
    Record<string, string>
  >({});
  const [repositoryOptions, setRepositoryOptions] = useState<
    { id: string; fullName: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  // Identifies the most recent request so a slow response for an old filter
  // cannot overwrite the rows for the filter the user is looking at now.
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    listRepositories({ limit: 100 })
      .then((response) => {
        setRepositoryOptions(
          response.items.map((repo) => ({ id: repo.id, fullName: repo.full_name }))
        );
        setRepositoryNames((previous) => {
          const next = { ...previous };
          for (const repo of response.items) {
            next[repo.id] = repo.full_name;
          }
          return next;
        });
      })
      .catch(() => {
        // A session row still renders without a repository name, so a failed
        // lookup degrades the table's labels rather than the table itself.
      });
    return () => controller.abort();
  }, [reloadToken]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    listSessions({
      limit: PAGE_SIZE,
      status: statusFilter || undefined,
      repository_id: repositoryFilter || undefined,
    })
      .then((response) => {
        if (requestIdRef.current !== requestId) return;
        setSessions(response.items);
        setTotal(response.total);
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setSessions([]);
        setTotal(0);
        setError(
          err instanceof Error ? err.message : "Failed to load sessions"
        );
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setIsLoading(false);
      });
  }, [statusFilter, repositoryFilter, reloadToken]);

  // Search runs over the loaded page because the backend list route filters by
  // status and repository only. Matches the real fields a user can see.
  const visibleSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) => {
      const repositoryName = session.repository_id
        ? repositoryNames[session.repository_id]
        : undefined;
      return (
        session.task_prompt.toLowerCase().includes(query) ||
        session.id.toLowerCase().includes(query) ||
        (session.repository_id ?? "").toLowerCase().includes(query) ||
        (repositoryName ?? "").toLowerCase().includes(query)
      );
    });
  }, [sessions, searchQuery, repositoryNames]);

  const hasFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "" ||
    repositoryFilter !== "";

  const retry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Sessions
            </h1>
            <p className="text-sm text-slate-400">
              Historical archive of autonomous agent runs, bisect traces, and token telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
              Total Runs: {total}
            </span>
            <button
              type="button"
              onClick={retry}
              disabled={isLoading}
              aria-label="Reload sessions"
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              Reload
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by prompt, session ID, or repository..."
              aria-label="Search sessions"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ListFilter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as SessionStatus | "")
              }
              aria-label="Filter by status"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>

            <select
              value={repositoryFilter}
              onChange={(e) => setRepositoryFilter(e.target.value)}
              aria-label="Filter by repository"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All Repositories</option>
              {repositoryOptions.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sessions Table / List */}
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-800/60 bg-rose-950/30 p-4"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-rose-200">
                Could not load sessions
              </p>
              <p className="text-xs text-rose-300/80">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="rounded-md border border-rose-800/60 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-900/40"
              >
                Try again
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-slate-800 bg-[#0f172a] p-6"
          >
            <p className="text-sm text-slate-400">Loading sessions…</p>
          </div>
        ) : visibleSessions.length > 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">
                  Archived agent sessions
                </caption>
                <thead className="border-b border-slate-800 bg-[#0b1220] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Session &amp; Objective</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Iterations</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {visibleSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-xs font-bold text-blue-400"
                            title={session.id}
                          >
                            {shortSessionId(session.id)}
                          </span>
                          {session.repository_id ? (
                            <span className="text-[11px] text-slate-500 font-mono">
                              {repositoryNames[session.repository_id] ??
                                "Unnamed repository"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600 font-sans italic">
                              No repository
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">
                          {session.task_prompt}
                        </p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-sans">
                        <StatusBadge status={session.status} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        {session.iteration_count} steps
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        {session.total_tokens.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {formatDuration(sessionDurationSeconds(session))}
                      </td>

                      <td
                        className="px-4 py-3 whitespace-nowrap text-slate-400"
                        title={formatAbsoluteTime(session.started_at ?? session.created_at)}
                      >
                        {formatRelativeTime(
                          session.started_at ?? session.created_at
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/workspace?session_id=${session.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                          >
                            Workspace <ArrowUpRight className="h-3 w-3" />
                          </Link>
                          <Link
                            href={`/activity?session_id=${session.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
                          >
                            Inspect <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
            <EmptyState
              icon={Layers}
              title={
                hasFilters
                  ? "No Matching Sessions Found"
                  : "No Sessions Yet"
              }
              description={
                hasFilters
                  ? "No archived agent sessions match your search and filter criteria. Adjust your filters or dispatch a new task from Workspace."
                  : "Once you dispatch an agent task from the workspace, it will appear here with its status, timing, and token usage."
              }
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SessionsPage() {
  return (
    <RequireAuth>
      <SessionsContent />
    </RequireAuth>
  );
}

export default SessionsPage;
