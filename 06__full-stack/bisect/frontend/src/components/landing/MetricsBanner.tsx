"use client";

import { Clock, Zap, Shield, ShieldCheck } from "lucide-react";

export function MetricsBanner() {
  const metrics = [
    {
      value: "85%",
      label: "Triage Time Saved",
      description: "Automated binary search vs manual test runs across commits",
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      value: "< 2.0s",
      label: "Groq Reasoning Latency",
      description: "Fast sub-second agent turns for AST and stack trace diagnosis",
      icon: Zap,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      value: "100%",
      label: "Container Sandboxed",
      description: "Disposable Podman environments protect host machines",
      icon: Shield,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      value: "0",
      label: "Unapproved Writes",
      description: "Human-in-the-loop safety gates require explicit verification",
      icon: ShieldCheck,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <section className="relative border-y border-slate-800 bg-[#0c1322]/80 py-12 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="relative rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 shadow-sm transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-3xl font-extrabold tracking-tight font-mono ${m.color}`}>
                    {m.value}
                  </span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${m.border} ${m.bg}`}>
                    <Icon className={`h-4 w-4 ${m.color}`} />
                  </div>
                </div>
                <h2 className="text-sm font-bold text-slate-100">{m.label}</h2>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {m.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
