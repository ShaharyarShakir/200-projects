"use client";

import React, { useState } from "react";
import { GitCommit, Check, X, AlertTriangle, Play, HelpCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommitOutcome = "good" | "bad" | "culprit" | "testing" | "untested";

/**
 * Why there is nothing to draw.
 *
 * `loading` is distinct from the empty cases because the backend has not
 * answered yet, and reporting "no timeline" during a load would assert a result
 * that is not known. `unavailable` means the session produced no timeline at
 * all, which is the normal case for a run that never bisected. `empty` means a
 * timeline exists but evaluated nothing, which is a different fact and worth
 * saying plainly rather than hiding behind the same message.
 */
export type ArtifactState = "loading" | "unavailable" | "empty" | "ready";

export interface BisectCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  timestamp: string;
  outcome: CommitOutcome;
  testOutput?: string;
  durationSeconds?: number;
}

interface CommitTimelineScrubberProps {
  commits?: BisectCommit[];
  activeHash?: string;
  artifactState?: ArtifactState;
  onSelectCommit?: (commit: BisectCommit) => void;
  className?: string;
}

export function CommitTimelineScrubber({
  commits = [],
  activeHash,
  artifactState = "unavailable",
  onSelectCommit,
  className,
}: CommitTimelineScrubberProps) {
  const [selectedCommit, setSelectedCommit] = useState<BisectCommit | null>(
    commits.find((c) => c.hash === activeHash) ?? null
  );

  const handleSelect = (commit: BisectCommit) => {
    setSelectedCommit(commit);
    onSelectCommit?.(commit);
  };

  const culpritCommit = commits.find((c) => c.outcome === "culprit");

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Interactive Git Bisect Timeline
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated binary search progression across git commit history.
          </p>
        </div>

        {culpritCommit && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-800/60 bg-rose-950/40 px-3 py-1 text-xs font-medium text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Breaking Commit Isolated:</span>
            <span className="font-mono font-bold text-white">{culpritCommit.shortHash}</span>
          </div>
        )}
      </div>

      {commits.length === 0 ? (
        <div
          data-testid={
            artifactState === "loading"
              ? "timeline-loading"
              : artifactState === "empty"
              ? "timeline-empty"
              : "timeline-unavailable"
          }
          className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-[#090d16] p-8 text-center"
        >
          <GitCommit className="h-7 w-7 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-300">
            {artifactState === "loading"
              ? "Loading timeline…"
              : artifactState === "empty"
              ? "No commits were evaluated"
              : "No bisect timeline for this session"}
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            {artifactState === "loading"
              ? "Reading the bisect timeline this session produced."
              : artifactState === "empty"
              ? "The bisect ran but tested no commits, so there is no track to show."
              : "This session recorded no bisect, so there is no timeline to show. Nothing is drawn here rather than invented commits."}
          </p>
        </div>
      ) : (
      <>
      {/* Visual Timeline Nodes */}
      <div className="relative my-6 px-4">
        {/* Connecting track line */}
        <div className="absolute top-1/2 left-6 right-6 h-1 -translate-y-1/2 bg-slate-800" />

        <div className="relative flex items-center justify-between">
          {commits.map((commit) => {
            const isSelected = selectedCommit?.hash === commit.hash;
            const isCulprit = commit.outcome === "culprit";

            return (
              <button
                key={commit.hash}
                type="button"
                onClick={() => handleSelect(commit)}
                aria-label={`Commit ${commit.shortHash}: ${commit.outcome}`}
                className={cn(
                  "group relative flex flex-col items-center focus:outline-none transition-transform",
                  isSelected && "scale-110"
                )}
              >
                {/* Node Dot */}
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all shadow-md",
                    commit.outcome === "good" &&
                      "border-emerald-500 bg-emerald-950 text-emerald-300 ring-2 ring-emerald-500/20",
                    commit.outcome === "bad" &&
                      "border-rose-500 bg-rose-950 text-rose-300 ring-2 ring-rose-500/20",
                    commit.outcome === "culprit" &&
                      "border-amber-400 bg-rose-900 text-amber-200 ring-4 ring-rose-500/40 animate-bounce",
                    commit.outcome === "testing" &&
                      "border-blue-400 bg-blue-950 text-blue-300 animate-pulse",
                    commit.outcome === "untested" &&
                      "border-slate-600 bg-slate-900 text-slate-400",
                    isSelected && "ring-2 ring-white"
                  )}
                >
                  {commit.outcome === "good" && <Check className="h-4 w-4" />}
                  {commit.outcome === "bad" && <X className="h-4 w-4" />}
                  {commit.outcome === "culprit" && <AlertTriangle className="h-4 w-4" />}
                  {commit.outcome === "testing" && <Play className="h-3.5 w-3.5 fill-current" />}
                  {commit.outcome === "untested" && <HelpCircle className="h-4 w-4" />}
                </div>

                {/* Hash Label */}
                <span
                  className={cn(
                    "mt-2 font-mono text-[11px] font-semibold transition-colors",
                    isSelected ? "text-blue-300 underline" : "text-slate-400 group-hover:text-slate-200"
                  )}
                >
                  {commit.shortHash}
                </span>

                {/* Badge for Culprit / Head */}
                {isCulprit && (
                  <span className="mt-1 rounded bg-rose-900/80 px-1.5 py-0.2 text-[9px] font-bold text-rose-200 uppercase tracking-wider border border-rose-600/50">
                    Regressed
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Commit Inspector Panel */}
      {selectedCommit && (
        <div className="rounded-lg border border-slate-800 bg-[#090d16] p-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-100 text-sm">
                commit {selectedCommit.hash}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize border",
                  selectedCommit.outcome === "good" &&
                    "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
                  selectedCommit.outcome === "bad" &&
                    "border-rose-800/60 bg-rose-950/40 text-rose-300",
                  selectedCommit.outcome === "culprit" &&
                    "border-amber-700/60 bg-amber-950/40 text-amber-300",
                  selectedCommit.outcome === "testing" &&
                    "border-blue-800/60 bg-blue-950/40 text-blue-300",
                  selectedCommit.outcome === "untested" &&
                    "border-slate-700 bg-slate-800 text-slate-300"
                )}
              >
                Outcome: {selectedCommit.outcome}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
              <span>Author: {selectedCommit.author}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {selectedCommit.timestamp}
              </span>
            </div>
          </div>

          <p className="text-slate-200 font-medium mb-3">{selectedCommit.message}</p>

          {selectedCommit.testOutput && (
            <div className="mt-2 rounded bg-black/60 p-3 font-mono text-[11px] text-slate-300 border border-slate-900">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 pb-1 border-b border-slate-800">
                <span>Automated Test Output</span>
                <span>{selectedCommit.durationSeconds}s execution</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {selectedCommit.testOutput}
              </pre>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
