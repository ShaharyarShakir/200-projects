"use client";

import { useState } from "react";
import { FolderGit2, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { RepositoryRead } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface WorkspaceHeaderProps {
  repositories: RepositoryRead[];
  selectedRepo: RepositoryRead | null;
  onSelectRepo: (repo: RepositoryRead) => void;
  onSyncRepos: () => Promise<void>;
  isSyncing?: boolean;
  /** True while the initial repository list is still in flight. */
  isLoading?: boolean;
  /** A failure loading the list. The selector keeps working if it can. */
  error?: string | null;
}

export function WorkspaceHeader({
  repositories,
  selectedRepo,
  onSelectRepo,
  onSyncRepos,
  isSyncing = false,
  isLoading = false,
  error = null,
}: WorkspaceHeaderProps) {
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  const handleSync = async () => {
    try {
      await onSyncRepos();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch {
      // Error handled by caller
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
          <FolderGit2 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100">
              {selectedRepo ? selectedRepo.full_name : "Select Repository"}
            </h2>
            {selectedRepo ? (
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {selectedRepo.default_branch}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-400">
            {isLoading
              ? "Loading your repositories…"
              : error
              ? "Could not load repositories"
              : selectedRepo
              ? selectedRepo.is_private
                ? "Private Repository"
                : "Public Repository"
              : repositories.length === 0
              ? "No repositories connected. Sync to import your GitHub repositories."
              : "Choose a connected GitHub repository to start an agent task"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {error && (
          <span
            role="alert"
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-800/60 bg-rose-950/40 px-2.5 py-1.5 text-xs text-rose-300"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </span>
        )}
        {isLoading ? (
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading repositories…
          </span>
        ) : repositories.length > 0 ? (
          <select
            value={selectedRepo ? selectedRepo.id : ""}
            onChange={(e) => {
              const found = repositories.find((r) => r.id === e.target.value);
              if (found) onSelectRepo(found);
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            aria-label="Repository Selector"
          >
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.full_name}
              </option>
            ))}
          </select>
        ) : null}

        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200",
            "hover:bg-slate-800 hover:text-white disabled:opacity-50"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing..." : "Sync Repos"}
        </button>

        {syncSuccess ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Synced
          </span>
        ) : null}
      </div>
    </div>
  );
}
