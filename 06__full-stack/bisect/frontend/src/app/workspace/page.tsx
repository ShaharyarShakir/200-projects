"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { StatusSummary } from "@/components/workspace/StatusSummary";
import { SessionCard } from "@/components/workspace/SessionCard";
import { SessionInsightsPanel } from "@/components/workspace/SessionInsightsPanel";
import { ActivityFeed } from "@/components/workspace/ActivityFeed";
import { AgentModelSelector, AGENT_MODELS, AgentModelOption } from "@/components/workspace/AgentModelSelector";
import { OpenSpecLifecycleTracker, OpenSpecPhaseId } from "@/components/workspace/OpenSpecLifecycleTracker";
import { CommitTimelineScrubber } from "@/components/workspace/CommitTimelineScrubber";
import { DiffReviewPanel } from "@/components/workspace/DiffReviewPanel";
import type { ArtifactState } from "@/components/workspace/DiffReviewPanel";
import { HumanApprovalGate, PendingApprovalRequest } from "@/components/workspace/HumanApprovalGate";
import { ErrorBanner } from "@/components/ui/ErrorState";
import { useSessionPoll } from "@/lib/hooks/useSessionPoll";
import { useSessionEvents } from "@/lib/hooks/useSessionEvents";
import { useSessionArtifacts } from "@/lib/hooks/useSessionArtifacts";
import { repositoriesApi } from "@/lib/api/repositories";
import { sessionsApi, getSession } from "@/lib/api/sessions";
import { RepositoryRead } from "@/lib/api/types";
import { ApiClientError } from "@/lib/api/client";
import { isTerminalStatus } from "@/lib/session-format";
import { deriveValidationState } from "@/lib/session-insights";
import { toPanelCommits } from "@/lib/session-artifacts";
import { parseUnifiedDiff } from "@/lib/diff/parse-unified-diff";
import {
  Play,
  Sparkles,
  RefreshCw,
  Activity,
  GitCommit,
  FileDiff,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Session ids are uuid4 hex, so anything else is not worth a request. */
const SESSION_ID_PATTERN = /^[0-9a-f]{32}$/;

/**
 * Keeps a junk `?session_id=` from becoming the active session. The backend
 * still decides ownership and answers 404 for a session that is not the
 * caller's, so this only rejects values that cannot be a session id at all.
 */
function normalizeSessionIdParam(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return SESSION_ID_PATTERN.test(trimmed) ? trimmed : null;
}

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id");

  const [repositories, setRepositories] = useState<RepositoryRead[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepositoryRead | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(true);
  const [isSyncingRepos, setIsSyncingRepos] = useState<boolean>(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Active Session & Creation State
  //
  // A session can arrive two ways: created here, or opened through
  // `?session_id=`. Without the second path a finished run's patch and
  // timeline were unreachable, because nothing ever set this state again
  // after the run that created it went away.
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    normalizeSessionIdParam(sessionIdParam)
  );
  const [taskPrompt, setTaskPrompt] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<AgentModelOption>(AGENT_MODELS[0]);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Cockpit View Tabs
  const [activeTab, setActiveTab] = useState<"activity" | "timeline" | "diff">("activity");

  // Human Approval Gate state
  const [pendingApproval, setPendingApproval] = useState<PendingApprovalRequest | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Polling Hook for active session
  const {
    session,
    isLoading: isLoadingSession,
    isRefreshing,
    error: sessionError,
    isPolling,
    refresh: refreshSession,
  } = useSessionPoll(activeSessionId, { intervalMs: 2000 });

  // The event feed is the activity tab's data source, so it follows the same
  // session and stops polling once the run reaches a terminal status.
  const {
    events: sessionEvents,
    isLoading: isLoadingEvents,
    error: eventsError,
    refresh: refreshEvents,
  } = useSessionEvents(activeSessionId, {
    enabled: !session || !isTerminalStatus(session.status),
    intervalMs: 2000,
  });

  // The patch and timeline panels read the same session and stop polling on the
  // same terminal condition, so a finished run does not keep re-fetching
  // artifacts that will never change again.
  const {
    patch,
    timeline,
    isLoading: isLoadingArtifacts,
    error: artifactsError,
    refresh: refreshArtifacts,
  } = useSessionArtifacts(activeSessionId, {
    enabled: !session || !isTerminalStatus(session.status),
    intervalMs: 2000,
  });

  // Parsed from the diff exactly as the backend returned it. `exists` and
  // `is_empty` are kept separate so the panel can say which of the two empty
  // cases it is instead of collapsing them into one message.
  const changedFiles = useMemo(
    () => parseUnifiedDiff(patch.diff),
    [patch.diff]
  );
  const timelineCommits = useMemo(
    () => toPanelCommits(timeline),
    [timeline]
  );

  // Follows the URL so a deep link, a back/forward step, and a link from the
  // sessions archive all land on the same session.
  useEffect(() => {
    setActiveSessionId(normalizeSessionIdParam(sessionIdParam));
  }, [sessionIdParam]);

  // `useSessionPoll` keeps only the error message, so the 404 that tells a
  // missing session apart from a failed refresh cannot be recovered from it.
  // The link is therefore checked once here, where the status code is still
  // available. A 404 is deliberately indistinguishable between "deleted" and
  // "not yours", so the message covers both.
  useEffect(() => {
    const target = normalizeSessionIdParam(sessionIdParam);
    if (!target) {
      setLinkError(null);
      return;
    }
    let cancelled = false;
    getSession(target)
      .then(() => {
        if (!cancelled) setLinkError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLinkError(
          err instanceof ApiClientError && err.code === "not_found"
            ? "That session does not exist, or it belongs to another account. " +
                "Open one from the Sessions archive, or start a new task below."
            : err instanceof Error
            ? err.message
            : "Failed to open that session."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [sessionIdParam]);

  // A session with no artifacts must read as "none", never as invented content.
  // While the first request is still in flight neither of the two empty cases is
  // known yet, so the panels are told they are loading rather than told there is
  // nothing, which would assert a result the backend has not given.
  const isFirstArtifactLoad =
    isLoadingArtifacts && !patch.exists && !timeline.exists;

  const patchState: ArtifactState = isFirstArtifactLoad
    ? "loading"
    : !patch.exists
    ? "unavailable"
    : changedFiles.length === 0
    ? "empty"
    : "ready";
  const timelineState: ArtifactState = isFirstArtifactLoad
    ? "loading"
    : !timeline.exists
    ? "unavailable"
    : timelineCommits.length === 0
    ? "empty"
    : "ready";

  // Load repositories on mount
  useEffect(() => {
    let isMounted = true;

    const loadRepositories = async () => {
      setIsLoadingRepos(true);
      setRepoError(null);
      try {
        const response = await repositoriesApi.getRepositories({ limit: 100 });
        if (isMounted) {
          setRepositories(response.items);
          if (response.items.length > 0) {
            setSelectedRepo((prev) => prev || response.items[0]);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to load repositories";
          setRepoError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRepos(false);
        }
      }
    };

    loadRepositories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Repositories Action
  const handleSyncRepos = async () => {
    setIsSyncingRepos(true);
    setRepoError(null);
    try {
      const syncResult = await repositoriesApi.syncRepositories();
      setRepositories(syncResult.repositories);
      if (syncResult.repositories.length > 0) {
        const exists = syncResult.repositories.find((r) => r.id === selectedRepo?.id);
        setSelectedRepo(exists || syncResult.repositories[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync repositories";
      setRepoError(msg);
      throw err;
    } finally {
      setIsSyncingRepos(false);
    }
  };

  // Start Agent Task Action
  const handleStartTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskPrompt.trim() || isCreatingSession) return;

    setIsCreatingSession(true);
    setActionError(null);

    try {
      const newSession = await sessionsApi.createSession({
        task_prompt: taskPrompt.trim(),
        repository_id: selectedRepo?.id,
      });
      setActiveSessionId(newSession.id);
      setActiveTab("activity");
      // Puts the run in the address bar so it survives a reload and can be
      // linked to. replace() keeps this out of the history, so Back does not
      // walk into a run the user has already left.
      router.replace(`/workspace?session_id=${newSession.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger agent task";
      setActionError(msg);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Approval Gate Actions
  const handleApproveAction = async (requestId: string) => {
    setIsApproving(true);
    void requestId;
    setTimeout(() => {
      setPendingApproval(null);
      setIsApproving(false);
    }, 600);
  };

  const handleRejectAction = async (requestId: string, reason?: string) => {
    setIsApproving(true);
    void requestId;
    void reason;
    setTimeout(() => {
      setPendingApproval(null);
      setIsApproving(false);
    }, 600);
  };

  // Derive OpenSpec phase
  const getOpenSpecPhase = (): OpenSpecPhaseId => {
    if (!session) return "explore";
    if (session.status === "running") return "implement";
    if (session.status === "completed") return "verify";
    if (session.status === "failed") return "propose";
    return "explore";
  };

  // Derived from the recorded events, not from the status alone: a completed run
  // whose actions were rejected must not read as cleanly validated, and a failed
  // run needs the specific errors the backend captured.
  const validationStatus = deriveValidationState(session, sessionEvents);

  const workspaceStatus = repoError
    ? "error"
    : isLoadingRepos
    ? "loading"
    : "ready";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Workspace Title & Actions Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Agent Workspace
            </h1>
            <p className="text-sm text-slate-400">
              Cockpit for agent execution, real-time status inspection, and validation.
            </p>
          </div>

          {/* Available before any session exists: the user should be able to
              retry a failed load, and see that data is being fetched, rather
              than being told nothing is happening. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshSession();
                refreshEvents();
                refreshArtifacts();
              }}
              disabled={!activeSessionId || isRefreshing}
              aria-label="Refresh session"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  (isRefreshing || isPolling) && "animate-spin text-blue-400"
                )}
              />
              {isRefreshing
                ? "Refreshing…"
                : isPolling
                ? "Polling live..."
                : "Refresh"}
            </button>
          </div>
        </div>

        {/* Global Error Banners */}
        {repoError && (
          <ErrorBanner
            message={`Repository Error: ${repoError}`}
            onDismiss={() => setRepoError(null)}
          />
        )}
        {actionError && (
          <ErrorBanner
            message={`Task Error: ${actionError}`}
            onDismiss={() => setActionError(null)}
          />
        )}
        {linkError && (
          <ErrorBanner
            message={linkError}
            onDismiss={() => {
              setLinkError(null);
              router.replace("/workspace");
            }}
          />
        )}

        {/* Human-in-the-Loop Safety Gate (if pending approval) */}
        {pendingApproval && (
          <HumanApprovalGate
            request={pendingApproval}
            onApprove={handleApproveAction}
            onReject={handleRejectAction}
            isProcessing={isApproving}
          />
        )}

        {/* Repository Selector & Connection Status */}
        <WorkspaceHeader
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelectRepo={(repo) => setSelectedRepo(repo)}
          onSyncRepos={handleSyncRepos}
          isSyncing={isSyncingRepos}
          isLoading={isLoadingRepos}
          error={repoError}
        />

        {/* Workspace & Lifecycle Status Summary */}
        <StatusSummary
          workspaceStatus={workspaceStatus}
          sessionStatus={session?.status || null}
          validationStatus={validationStatus}
        />

        {/* OpenSpec Lifecycle Progression Tracker */}
        <OpenSpecLifecycleTracker currentPhase={getOpenSpecPhase()} />

        {/* Task Trigger Bar with Model Router */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Dispatch Agent Task
            </h2>
          </div>

          <form onSubmit={handleStartTask} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <AgentModelSelector
                  selectedModelId={selectedModel.id}
                  onSelectModel={(m) => setSelectedModel(m)}
                  disabled={isCreatingSession}
                />
              </div>

              <div className="md:col-span-2 flex flex-col justify-end">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Task Prompt / Bisect Objective
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={taskPrompt}
                    onChange={(e) => setTaskPrompt(e.target.value)}
                    placeholder="e.g. Identify failing test in tests/test_engine.py and formulate root cause..."
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    disabled={isCreatingSession}
                  />

                  <button
                    type="submit"
                    disabled={isCreatingSession || !taskPrompt.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shrink-0"
                  >
                    {isCreatingSession ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )}
                    {isCreatingSession ? "Starting..." : "Start Task"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick task presets */}
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
              <span className="text-xs text-slate-500">Suggested Presets:</span>
              {[
                "Locate test failures in test suite",
                "Inspect package dependencies and versions",
                "Check git diff and changed files",
                "Run automated bisect on git commit history",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTaskPrompt(preset)}
                  className="rounded border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200"
                >
                  {preset}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* View Mode Tabs (Activity Trace, Bisect Timeline, Diff Review) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "activity"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              Live Execution Trace
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "timeline"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <GitCommit className="h-3.5 w-3.5" />
              Bisect Timeline
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("diff")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeTab === "diff"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <FileDiff className="h-3.5 w-3.5" />
              Diff & Patch Review
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === "activity" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Session Metrics, status, validation & lifecycle (1 col) */}
            <div className="space-y-6 lg:col-span-1">
              <SessionCard
                session={session}
                isLoading={isLoadingSession}
                error={sessionError}
              />
              {/* The card already reports a session-load failure; the panel
                  derives from events, so its failure is the events request. */}
              {(session || !sessionError) && (
                <SessionInsightsPanel
                  session={session}
                  events={sessionEvents}
                  isLoading={isLoadingSession || isLoadingEvents}
                  error={eventsError}
                />
              )}
            </div>

            {/* Chronological Activity Feed (2 cols) */}
            <div className="lg:col-span-2">
              <ActivityFeed
                events={sessionEvents}
                isLoading={isLoadingSession || isLoadingEvents}
                error={eventsError}
                onRetry={refreshEvents}
              />
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-3">
            {artifactsError && (
              <ErrorBanner
                message={`Timeline Error: ${artifactsError}`}
                onDismiss={refreshArtifacts}
              />
            )}
            <CommitTimelineScrubber
              commits={timelineCommits}
              artifactState={timelineState}
            />
          </div>
        )}

        {activeTab === "diff" && (
          <div className="space-y-3">
            {artifactsError && (
              <ErrorBanner
                message={`Diff Error: ${artifactsError}`}
                onDismiss={refreshArtifacts}
              />
            )}
            <DiffReviewPanel files={changedFiles} artifactState={patchState} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function WorkspacePage() {
  return (
    <RequireAuth>
      <WorkspaceContent />
    </RequireAuth>
  );
}

export default WorkspacePage;
