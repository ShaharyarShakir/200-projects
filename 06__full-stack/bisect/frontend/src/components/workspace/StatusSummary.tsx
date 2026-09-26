"use client";

import { SessionStatus } from "@/lib/api/types";
import { VALIDATION_LABEL, type ValidationState } from "@/lib/session-insights";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  MinusCircle,
} from "lucide-react";

interface StatusSummaryProps {
  workspaceStatus?: "ready" | "loading" | "error" | "unauthenticated";
  sessionStatus?: SessionStatus | null;
  validationStatus?: ValidationState;
}

export function StatusSummary({
  workspaceStatus = "ready",
  sessionStatus = null,
  validationStatus = "not_run",
}: StatusSummaryProps) {
  const getSessionBadge = (status: SessionStatus | null) => {
    if (!status) {
      return {
        label: "None",
        icon: MinusCircle,
        className: "bg-slate-800 text-slate-400 border-slate-700",
      };
    }
    switch (status) {
      case "created":
        return {
          label: "Created (Idle)",
          icon: Clock,
          className: "bg-amber-950/40 text-amber-300 border-amber-800/60",
        };
      case "running":
        return {
          label: "Running",
          icon: Loader2,
          className: "bg-blue-950/40 text-blue-300 border-blue-800/60 animate-pulse",
          spin: true,
        };
      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle2,
          className: "bg-emerald-950/40 text-emerald-300 border-emerald-800/60",
        };
      case "failed":
        return {
          label: "Failed",
          icon: AlertCircle,
          className: "bg-red-950/40 text-red-300 border-red-800/60",
        };
      case "terminated":
        return {
          label: "Terminated",
          icon: XCircle,
          className: "bg-rose-950/40 text-rose-300 border-rose-800/60",
        };
      case "timed_out":
        return {
          label: "Timed Out",
          icon: Clock,
          className: "bg-orange-950/40 text-orange-300 border-orange-800/60",
        };
      default:
        return {
          label: String(status),
          icon: MinusCircle,
          className: "bg-slate-800 text-slate-400 border-slate-700",
        };
    }
  };

  const sessionBadge = getSessionBadge(sessionStatus);
  const SessionIcon = sessionBadge.icon;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Workspace Panel */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Workspace
        </span>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">
            {workspaceStatus === "ready"
              ? "Ready"
              : workspaceStatus === "loading"
              ? "Loading..."
              : workspaceStatus === "unauthenticated"
              ? "Sign-in required"
              : "Error"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              workspaceStatus === "ready"
                ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"
                : "border-slate-700 bg-slate-800 text-slate-300"
            )}
          >
            {workspaceStatus === "ready" ? "Operational" : "Standby"}
          </span>
        </div>
      </div>

      {/* Agent Session Panel */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Agent Session
        </span>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">
            {sessionBadge.label}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              sessionBadge.className
            )}
          >
            <SessionIcon
              className={cn("h-3 w-3", sessionBadge.spin && "animate-spin")}
            />
            {sessionStatus ? sessionStatus.toUpperCase() : "NONE"}
          </span>
        </div>
      </div>

      {/* Validation Panel */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Validation
        </span>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">
            {VALIDATION_LABEL[validationStatus]}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              validationStatus === "passed"
                ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-300"
                : validationStatus === "failed"
                ? "border-red-800/60 bg-red-950/40 text-red-300"
                : validationStatus === "issues"
                ? "border-amber-800/60 bg-amber-950/40 text-amber-300"
                : validationStatus === "validating"
                ? "border-blue-800/60 bg-blue-950/40 text-blue-300"
                : "border-slate-700 bg-slate-800 text-slate-400"
            )}
          >
            {validationStatus === "passed" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : null}
            {validationStatus.toUpperCase().replace("_", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}
