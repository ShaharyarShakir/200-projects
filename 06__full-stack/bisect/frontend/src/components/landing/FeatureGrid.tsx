"use client";

import {
  GitCommit,
  Zap,
  Shield,
  ShieldCheck,
  Activity,
  FileDiff,
  Sparkles,
} from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      title: "Automated Git Bisect Engine",
      tag: "O(log N) SEARCH",
      description:
        "Automatically bisects Git history, running test commands on intermediate commits to pinpoint regressions with zero manual intervention.",
      icon: GitCommit,
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Sub-Second Groq AI Inference",
      tag: "LLAMA 3.3 FAST",
      description:
        "Leverages Groq's high-speed inference engine to analyze stack traces, examine code ASTs, and formulate root-cause explanations in under 2 seconds.",
      icon: Zap,
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "Isolated Podman Sandboxes",
      tag: "ZERO CONTAMINATION",
      description:
        "Every test execution and agent build step runs in an isolated, disposable Podman container, keeping your local host completely safe.",
      icon: Shield,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Human-in-the-Loop Safety Gate",
      tag: "POLICY PROTECTED",
      description:
        "Enforces strict manual sign-off barriers. The agent never applies a file diff or runs sensitive terminal commands without your explicit review.",
      icon: ShieldCheck,
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Live Execution Trace & Telemetry",
      tag: "REAL-TIME LOGS",
      description:
        "Monitor the agent's internal thought chain, test outputs, tool invocations, and status transitions through a live chronological cockpit stream.",
      icon: Activity,
      accent: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      title: "Visual Diff Review & Patching",
      tag: "SYNTAX-HIGHLIGHTED",
      description:
        "Inspect line-by-line syntax-highlighted diffs, review affected files, and verify test assertions before merging or committing changes.",
      icon: FileDiff,
      accent: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
  ];

  return (
    <section id="features" className="relative py-20 md:py-28 bg-[#090d16]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Built for Modern Software Engineering</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything you need to debug regressions with confidence
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Bisect bridges automated Git operations, container sandboxing, and ultra-fast
            AI reasoning into a single developer cockpit.
          </p>
        </div>

        {/* 6-Card Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-800 bg-[#0f172a]/80 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-[#111a30] hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${feat.border} ${feat.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${feat.accent}`} />
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-slate-400 rounded-md bg-slate-900 border border-slate-800 px-2 py-0.5">
                    {feat.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
