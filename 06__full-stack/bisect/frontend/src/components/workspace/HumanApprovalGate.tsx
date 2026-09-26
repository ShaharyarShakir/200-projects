"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Terminal,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PendingApprovalRequest {
  id: string;
  command: string;
  reason: string;
  riskLevel: "critical" | "high" | "moderate";
  affectedFiles?: string[];
  workdir?: string;
  timestamp: string;
}

interface HumanApprovalGateProps {
  request: PendingApprovalRequest | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export function HumanApprovalGate({
  request,
  onApprove,
  onReject,
  isProcessing = false,
  className,
}: HumanApprovalGateProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Keyboard shortcut listener (A for Approve, X for Reject)
  useEffect(() => {
    if (!request || isProcessing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        onApprove(request.id);
      } else if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        setShowRejectInput(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [request, isProcessing, onApprove]);

  if (!request) return null;

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    onReject(request.id, rejectReason.trim() || undefined);
    setShowRejectInput(false);
    setRejectReason("");
  };

  return (
    <div
      role="alertdialog"
      aria-labelledby="approval-title"
      aria-describedby="approval-desc"
      className={cn(
        "relative rounded-xl border-2 border-amber-500/80 bg-[#0d1322] p-5 shadow-2xl shadow-amber-950/40 ring-4 ring-amber-500/20 transition-all",
        className
      )}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 id="approval-title" className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Human-in-the-Loop Safety Gate
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-950/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wide">
                <AlertTriangle className="h-3 w-3" />
                {request.riskLevel} Risk Operation
              </span>
            </h3>
            <p id="approval-desc" className="text-xs text-slate-400 mt-0.5">
              The agent is paused and requesting explicit permission to execute this operation.
            </p>
          </div>
        </div>

        {/* Hotkey hint */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-300">
            Press [A]
          </span>
          <span>Approve</span>
          <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-300">
            Press [X]
          </span>
          <span>Reject</span>
        </div>
      </div>

      {/* Rationale / Context */}
      <div className="space-y-3 mb-5">
        <div className="rounded-lg bg-slate-900/90 p-3 text-xs border border-slate-800">
          <span className="font-semibold text-slate-300 block mb-1">
            Agent Rationale:
          </span>
          <p className="text-slate-300 leading-relaxed">{request.reason}</p>
        </div>

        {/* Command Box */}
        <div className="rounded-lg bg-[#050811] p-3.5 border border-slate-800/80 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-500 text-[10px] mb-2 pb-1 border-b border-slate-900">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              Proposed Shell Command
            </span>
            {request.workdir && <span>workdir: {request.workdir}</span>}
          </div>
          <div className="text-amber-300 bg-amber-950/20 p-2.5 rounded border border-amber-900/30 overflow-x-auto whitespace-pre-wrap font-bold">
            $ {request.command}
          </div>
        </div>

        {/* Affected files */}
        {request.affectedFiles && request.affectedFiles.length > 0 && (
          <div className="text-xs">
            <span className="text-slate-400 text-[11px] block mb-1">
              Targeted / Affected Files:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {request.affectedFiles.map((file) => (
                <span
                  key={file}
                  className="rounded bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-slate-300 border border-slate-700"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Reason Form (if opened) */}
      {showRejectInput ? (
        <form onSubmit={handleConfirmReject} className="flex flex-col gap-2 mb-4">
          <label className="text-xs text-slate-300 font-semibold">
            Rejection Feedback to Agent (Optional):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Do not delete files; try resetting the git worktree instead..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Confirm Rejection
            </button>
            <button
              type="button"
              onClick={() => setShowRejectInput(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* Action Buttons */
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setShowRejectInput(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-800/70 bg-rose-950/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Reject & Intercept (X)
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onApprove(request.id)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isProcessing ? "Authorizing..." : "Approve & Resume Execution (A)"}
          </button>
        </div>
      )}
    </div>
  );
}
