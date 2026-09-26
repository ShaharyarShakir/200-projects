"use client";

import React, { useState } from "react";
import {
  FileDiff,
  FileCode,
  Check,
  X,
  Play,
  Copy,
  CheckCheck,
  Columns,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChangedFile {
  path: string;
  additions: number;
  deletions: number;
  status: "modified" | "added" | "deleted";
  diffHunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  lines: {
    type: "add" | "delete" | "context";
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
  }[];
}

/**
 * Why there is nothing to review.
 *
 * `loading` is distinct from the empty cases on purpose: while the request is
 * in flight the backend has not said anything yet, and reporting "no patch"
 * during a load would assert a result that is not known. `unavailable` means the
 * session produced no patch, the normal case for a run that never generated one.
 * `empty` means a patch exists and contains no changes, which is a real result
 * the agent produced rather than a missing one, so the two are reported
 * differently instead of sharing a message.
 */
export type ArtifactState = "loading" | "unavailable" | "empty" | "ready";

interface DiffReviewPanelProps {
  files?: ChangedFile[];
  artifactState?: ArtifactState;
  onAcceptPatch?: () => void;
  onRejectPatch?: () => void;
  onRunValidation?: () => void;
  isValidating?: boolean;
  className?: string;
}

export function DiffReviewPanel({
  files = [],
  artifactState = "unavailable",
  onAcceptPatch,
  onRejectPatch,
  onRunValidation,
  isValidating = false,
  className,
}: DiffReviewPanelProps) {
  const isEmptyDiff = artifactState === "empty";
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || "");
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [copied, setCopied] = useState(false);

  const activeFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const totalAdditions = files.reduce((acc, f) => acc + f.additions, 0);
  const totalDeletions = files.reduce((acc, f) => acc + f.deletions, 0);

  const handleCopyPatch = () => {
    if (!activeFile) return;
    const rawPatch = activeFile.diffHunks
      .map((hunk) => hunk.header + "\n" + hunk.lines.map((l) => l.content).join("\n"))
      .join("\n\n");
    navigator.clipboard.writeText(rawPatch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Never fabricate a diff: with no real patch the panel says which of the
  // cases this is rather than rendering content that looks reviewable.
  if (files.length === 0) {
    const heading =
      artifactState === "loading"
        ? "Loading patch…"
        : artifactState === "empty"
        ? "Nothing to review"
        : "No patch for this session";
    const body =
      artifactState === "loading"
        ? "Reading the patch this session produced."
        : artifactState === "empty"
        ? "The agent produced a patch, but it contains no changes to review."
        : "This session recorded no patch, so there is no diff to review. Nothing is drawn here rather than invented content.";
    return (
      <div
        data-testid={
          artifactState === "loading"
            ? "diff-loading"
            : isEmptyDiff
            ? "diff-empty"
            : "diff-unavailable"
        }
        className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center"
      >
        <FileDiff className="mx-auto h-7 w-7 text-slate-600" />
        <h3 className="mt-3 text-sm font-semibold text-slate-300">{heading}</h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">{body}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-[#0f172a] shadow-sm transition-all overflow-hidden",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600/20 text-blue-400">
            <FileDiff className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Agent Candidate Diff & Patch Inspector
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                {files.length} {files.length === 1 ? "file" : "files"}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
              <span className="text-emerald-400">+{totalAdditions} additions</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400">-{totalDeletions} deletions</span>
            </div>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("unified")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                viewMode === "unified"
                  ? "bg-slate-800 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Unified
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                viewMode === "split"
                  ? "bg-slate-800 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Columns className="h-3.5 w-3.5" />
              Split
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyPatch}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            type="button"
            onClick={onRunValidation}
            disabled={isValidating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-900/80 disabled:opacity-50"
          >
            <Play className={cn("h-3 w-3 fill-current", isValidating && "animate-spin")} />
            {isValidating ? "Validating in Sandbox..." : "Run Tests"}
          </button>
        </div>
      </div>

      {/* Main Diff Content Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[320px]">
        {/* Changed Files Navigation Tree (1 col) */}
        <div className="border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#090d16]/70 p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            Changed Files
          </span>
          <div className="space-y-1">
            {files.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFilePath(file.path)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-blue-600/20 text-blue-200 font-medium"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <FileCode className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate font-mono">{file.path}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                    <span className="text-emerald-400">+{file.additions}</span>
                    <span className="text-rose-400">-{file.deletions}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Diff Hunks Code Viewer (3 cols) */}
        <div className="lg:col-span-3 bg-[#050811] p-4 overflow-x-auto">
          {activeFile ? (
            <div className="font-mono text-xs leading-relaxed space-y-4">
              {activeFile.diffHunks.map((hunk, hIdx) => (
                <div
                  key={hIdx}
                  className="rounded border border-slate-800 bg-[#0b1220]/60 overflow-hidden"
                >
                  {/* Hunk Header */}
                  <div className="bg-slate-900/90 px-3 py-1.5 text-[11px] text-blue-300 font-semibold border-b border-slate-800">
                    {hunk.header}
                  </div>

                  {/* Lines */}
                  <div className="divide-y divide-slate-900/40">
                    {hunk.lines.map((line, lIdx) => (
                      <div
                        key={lIdx}
                        className={cn(
                          "flex items-start px-2 py-0.5",
                          line.type === "add" && "bg-emerald-950/40 text-emerald-300 font-semibold",
                          line.type === "delete" && "bg-rose-950/40 text-rose-300 line-through opacity-80",
                          line.type === "context" && "text-slate-400"
                        )}
                      >
                        {/* Line Numbers */}
                        <span className="w-8 select-none text-right text-[10px] text-slate-600 mr-2">
                          {line.oldLineNumber || ""}
                        </span>
                        <span className="w-8 select-none text-right text-[10px] text-slate-600 mr-3">
                          {line.newLineNumber || ""}
                        </span>
                        {/* Prefix & Content */}
                        <span className="w-4 select-none text-center font-bold">
                          {line.type === "add" ? "+" : line.type === "delete" ? "-" : " "}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all">
                          {line.content.replace(/^[+-]/, "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500 text-xs">
              Select a file to inspect diff
            </div>
          )}
        </div>
      </div>

      {/* Footer Decisions */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-[#090d16] p-3">
        <span className="text-xs text-slate-400">
          Ready to apply candidate patch to local worktree branch?
        </span>

        <div className="flex items-center gap-2">
          {onRejectPatch && (
            <button
              type="button"
              onClick={onRejectPatch}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Discard Patch
            </button>
          )}
          {onAcceptPatch && (
            <button
              type="button"
              onClick={onAcceptPatch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <Check className="h-3.5 w-3.5" />
              Accept & Apply Patch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
