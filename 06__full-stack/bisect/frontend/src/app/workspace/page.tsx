"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { StatusSummary } from "@/components/workspace/StatusSummary";
import { SessionCard } from "@/components/workspace/SessionCard";
import { ActivityFeed } from "@/components/workspace/ActivityFeed";
import { AgentModelSelector, AGENT_MODELS, AgentModelOption } from "@/components/workspace/AgentModelSelector";
import { OpenSpecLifecycleTracker, OpenSpecPhaseId } from "@/components/workspace/OpenSpecLifecycleTracker";
import { CommitTimelineScrubber } from "@/components/workspace/CommitTimelineScrubber";
import { DiffReviewPanel } from "@/components/workspace/DiffReviewPanel";
import { HumanApprovalGate, PendingApprovalRequest } from "@/components/workspace/HumanApprovalGate";
import { ErrorBanner, ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { useSessionPoll } from "@/lib/hooks/useSessionPoll";
import { repositoriesApi } from "@/lib/api/repositories";
import { sessionsApi } from "@/lib/api/sessions";
import { RepositoryRead } from "@/lib/api/types";
import {
  Play,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Activity,
  GitCommit,
  FileDiff,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkspacePage() {
  const [repositories, setRepositories] = useState<RepositoryRead[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepositoryRead | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(true);
  const [isSyncingRepos, setIsSyncingRepos] = useState<boolean>(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Active Session & Creation State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [taskPrompt, setTaskPrompt] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<AgentModelOption>(AGENT_MODELS[0]);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Cockpit View Tabs
  const [activeTab, setActiveTab] = useState<"activity" | "timeline" | "diff">("activity");

  // Human Approval Gate state
  const [pendingApproval, setPendingApproval] = useState<PendingApprovalRequest | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Polling Hook for active session
  const {
    session,
    isLoading: isLoadingSession,
    error: sessionError,
    isPolling,
    refresh: refreshSession,
  } = useSessionPoll(activeSessionId, { intervalMs: 2000 });

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
    setTimeout(() => {
      setPendingApproval(null);
      setIsApproving(false);
    }, 600);
  };

  const handleRejectAction = async (requestId: string, reason?: string) => {
    setIsApproving(true);
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

  // Calculate Validation Status
  const getValidationStatus = (): "not_run" | "validating" | "passed" | "failed" => {
    if (!session) return "not_run";
    if (session.status === "running") return "validating";
    if (session.status === "completed") return "passed";
    if (
      session.status === "failed" ||
      session.status === "terminated" ||
      session.status === "timed_out"
    ) {
      return "failed";
    }
    return "not_run";
  };

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

          {activeSessionId && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refreshSession()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isPolling && "animate-spin text-blue-400")}
                />
                {isPolling ? "Polling live..." : "Refresh"}
              </button>
            </div>
          )}
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
        {sessionError && (
          <ErrorBanner
            message={`Session Error: ${sessionError}`}
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
        />

        {/* Workspace & Lifecycle Status Summary */}
        <StatusSummary
          workspaceStatus={workspaceStatus}
          sessionStatus={session?.status || null}
          validationStatus={getValidationStatus()}
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
            {/* Session Metrics & Inspector (1 col) */}
            <div className="lg:col-span-1">
              <SessionCard session={session} isLoading={isLoadingSession} />
            </div>

            {/* Chronological Activity Feed (2 cols) */}
            <div className="lg:col-span-2">
              <ActivityFeed
                steps={session?.steps || []}
                isLoading={isLoadingSession}
              />
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <CommitTimelineScrubber />
        )}

        {activeTab === "diff" && (
          <DiffReviewPanel />
        )}
      </div>
    </AppShell>
  );
}
