"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  GitCommit,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TerminalStep {
  id: number;
  label: string;
  tag: string;
  timestamp: string;
  title: string;
  command?: string;
  output: string[];
  status: "success" | "warning" | "info" | "gate";
  highlight?: string;
}

const TERMINAL_STEPS: TerminalStep[] = [
  {
    id: 1,
    label: "1. Sandbox Init",
    tag: "PODMAN CONTAINER",
    timestamp: "00:00.41",
    title: "Spawning isolated Podman runtime sandbox",
    command: "podman run --rm -d --net=none bisect-env:python3.12",
    output: [
      "✓ Container bisect-sandbox-99a initialized (isolated network, read-only host mount)",
      "✓ Cloned target repository (48 commits between good: v2.4.0 and bad: main)",
      "✓ Test runner registered: pytest tests/test_concurrency.py",
    ],
    status: "success",
  },
  {
    id: 2,
    label: "2. Automated Bisect",
    tag: "BISECT ENGINE",
    timestamp: "00:01.12",
    title: "Executing automated binary search across 48 commits",
    command: "git bisect start HEAD v2.4.0 && bisect-agent --auto",
    output: [
      "→ Step 1/5: Checking commit a4f910d (24 commits remaining)... PASS [240ms]",
      "→ Step 2/5: Checking commit d9e211a (12 commits remaining)... PASS [210ms]",
      "→ Step 3/5: Checking commit 7e91f0b (6 commits remaining)... FAIL [pytest 1 failed]",
      "✓ Culprit pinpointed: Commit 7e91f0b (\"refactor: concurrency in task queue\")",
    ],
    status: "info",
    highlight: "Regression isolated to 1 commit in 1.12s",
  },
  {
    id: 3,
    label: "3. Groq AI Diagnosis",
    tag: "GROQ LLM (0.8s)",
    timestamp: "00:01.94",
    title: "Root cause analysis & AST diff generation",
    command: "groq-agent --model llama-3.3-70b --inspect-stack-trace",
    output: [
      "Root Cause: Deadlock in TaskQueue._acquire_lock() due to unreleased mutex on exception.",
      "Proposed Fix: Replace bare lock acquisition with context manager `with self._lock:`",
      "Modified file: src/queue/worker.py (+3 lines, -1 line)",
    ],
    status: "warning",
    highlight: "AST patch generated and verified with 0 hallucinations",
  },
  {
    id: 4,
    label: "4. Human Safety Gate",
    tag: "SAFETY GATE",
    timestamp: "00:02.30",
    title: "Awaiting developer approval to apply verified patch",
    command: "bisect-gate --require-human-signoff",
    output: [
      "⚠️ GATE INTERRUPT: Agent paused before modifying working directory.",
      "Patch summary: Fix mutex release in worker.py. All 42 unit tests passing in sandbox.",
    ],
    status: "gate",
  },
];

export function HeroTerminal() {
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  // Auto-advance steps when playing
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % TERMINAL_STEPS.length);
      setIsApproved(false);
    }, 3800);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const step = TERMINAL_STEPS[currentStepIndex];

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-[#050811] shadow-2xl overflow-hidden shadow-blue-500/10 transition-all">
      {/* Terminal Window Header */}
      <div className="flex items-center justify-between border-b border-slate-800/90 bg-[#0a0f1d] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-2 font-mono text-xs text-slate-400 font-medium">
            bisect-cockpit ~ session-8f2a1b9
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            PODMAN: ACTIVE
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title={isPlaying ? "Pause playback" : "Play playback"}
              aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentStepIndex(0);
                setIsApproved(false);
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Reset simulation"
              aria-label="Reset simulation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Step Navigation Bar */}
      <div className="flex items-center overflow-x-auto border-b border-slate-800/80 bg-[#080d19] px-3 py-2 gap-1.5 terminal-scrollbar">
        {TERMINAL_STEPS.map((s, idx) => {
          const isActive = idx === currentStepIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setCurrentStepIndex(idx);
                setIsPlaying(false);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono transition-all whitespace-nowrap",
                isActive
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              {s.id === 1 && <Layers className="h-3 w-3 text-emerald-400" />}
              {s.id === 2 && <GitCommit className="h-3 w-3 text-blue-400" />}
              {s.id === 3 && <Sparkles className="h-3 w-3 text-purple-400" />}
              {s.id === 4 && <ShieldCheck className="h-3 w-3 text-amber-400" />}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Terminal Main Content Area */}
      <div className="p-5 font-mono text-xs space-y-4 min-h-[290px] flex flex-col justify-between">
        <div className="space-y-3">
          {/* Step Metadata Header */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-bold text-slate-300">
                {step.tag}
              </span>
              <span className="text-slate-300 font-semibold">{step.title}</span>
            </div>
            <span>T+{step.timestamp}</span>
          </div>

          {/* Executed Command Line */}
          {step.command && (
            <div className="flex items-center gap-2 text-slate-300 bg-slate-900/80 rounded-lg p-2.5 border border-slate-800">
              <span className="text-blue-400 font-bold">$</span>
              <span className="text-slate-200">{step.command}</span>
            </div>
          )}

          {/* Log Outputs */}
          <div className="space-y-1.5 pl-1 pt-1">
            {step.output.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "leading-relaxed",
                  line.startsWith("✓")
                    ? "text-emerald-400 font-medium"
                    : line.startsWith("⚠️")
                    ? "text-amber-400 font-semibold"
                    : line.startsWith("→")
                    ? "text-slate-300"
                    : "text-slate-400"
                )}
              >
                {line}
              </div>
            ))}
          </div>

          {/* Key Metric Highlight Badge */}
          {step.highlight && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-950/40 border border-blue-500/30 px-3 py-1.5 text-blue-300 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>{step.highlight}</span>
            </div>
          )}
        </div>

        {/* Interactive Human-in-the-Loop Approval Action (on step 4) */}
        {step.status === "gate" && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-200">
                    Human Safety Gate: Apply Diff?
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Modifies <code className="text-slate-300 font-mono">worker.py</code> (+3, -1) and runs full regression suite.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isApproved ? (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Patch Approved & Applied
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsApproved(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow transition-colors font-sans"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Fix
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer Telemetry */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-[#080d1a] px-4 py-2 text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span>GROQ: LLAMA-3.3-70B</span>
          <span>LATENCY: 184ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span>SECURITY: ISOLATED</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      </div>
    </div>
  );
}
