"use client";

import React from "react";
import {
  Compass,
  FileCode2,
  Hammer,
  CheckCircle2,
  Archive,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type OpenSpecPhaseId = "explore" | "propose" | "implement" | "verify" | "archive";

export interface OpenSpecPhaseInfo {
  id: OpenSpecPhaseId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const OPENSPEC_PHASES: OpenSpecPhaseInfo[] = [
  {
    id: "explore",
    label: "Explore",
    description: "Investigate problem, map files, and clarify requirements",
    icon: Compass,
  },
  {
    id: "propose",
    label: "Propose",
    description: "Formulate design delta and verify execution strategy",
    icon: FileCode2,
  },
  {
    id: "implement",
    label: "Implement",
    description: "Apply sandboxed changes and generate candidate patch",
    icon: Hammer,
  },
  {
    id: "verify",
    label: "Verify",
    description: "Execute automated tests, regression suite & typechecks",
    icon: CheckCircle2,
  },
  {
    id: "archive",
    label: "Archive",
    description: "Finalize spec sync, commit history, and artifacts",
    icon: Archive,
  },
];

interface OpenSpecLifecycleTrackerProps {
  currentPhase?: OpenSpecPhaseId;
  completedPhases?: OpenSpecPhaseId[];
  className?: string;
}

export function OpenSpecLifecycleTracker({
  currentPhase = "explore",
  completedPhases = [],
  className,
}: OpenSpecLifecycleTrackerProps) {
  const currentIndex = OPENSPEC_PHASES.findIndex((p) => p.id === currentPhase);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-[#0f172a] p-4 transition-all",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20 text-blue-400">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
            OpenSpec Lifecycle Progression
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Stage {currentIndex >= 0 ? currentIndex + 1 : 1} of 5:{" "}
          <span className="text-blue-400 font-semibold capitalize">{currentPhase}</span>
        </div>
      </div>

      {/* Steps Flow */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {OPENSPEC_PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isCurrent = phase.id === currentPhase;
          const isCompleted =
            completedPhases.includes(phase.id) || (currentIndex > idx && currentIndex !== -1);
          const isPending = !isCurrent && !isCompleted;

          return (
            <div
              key={phase.id}
              className={cn(
                "relative flex flex-col gap-1 rounded-lg border p-2.5 transition-all",
                isCurrent &&
                  "border-blue-500/70 bg-blue-950/30 text-blue-100 ring-1 ring-blue-500/30",
                isCompleted &&
                  "border-emerald-800/50 bg-emerald-950/20 text-emerald-200",
                isPending && "border-slate-800/80 bg-slate-900/40 text-slate-400"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isCurrent && "text-blue-400 animate-pulse",
                      isCompleted && "text-emerald-400",
                      isPending && "text-slate-400"
                    )}
                  />
                  <span className="text-xs font-bold">{phase.label}</span>
                </div>

                <span className="text-[10px] font-mono opacity-60">0{idx + 1}</span>
              </div>

              <p className="text-[10px] leading-tight text-slate-400 line-clamp-2 mt-0.5">
                {phase.description}
              </p>

              {isCurrent && (
                <div className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-blue-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                  Active Phase
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
