"use client";

import {
  FolderGit2,
  Terminal,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Connect Repo & Define Objective",
      subtitle: "Instant GitHub sync with zero boilerplate",
      description:
        "Connect your GitHub repository with 1-click OAuth. Enter your task objective or point Bisect to a failing test suite, regression range, or issue description.",
      icon: FolderGit2,
      codePreview: {
        title: "dispatch-task.json",
        snippet: `{\n  "repo": "org/payment-service",\n  "target_test": "tests/test_concurrency.py",\n  "good_ref": "v2.4.0",\n  "bad_ref": "HEAD"\n}`,
      },
    },
    {
      step: "02",
      title: "Sandboxed Bisect & Fast Diagnosis",
      subtitle: "Automated binary search inside Podman",
      description:
        "Bisect launches an isolated container sandbox, runs the test runner across git commits, and uses Groq's sub-second AI to diagnose the exact lines causing failure.",
      icon: Cpu,
      codePreview: {
        title: "bisect-engine.log",
        snippet: `[Podman] Container sandbox-8f2 initialized\n[Bisect] 14 commits remaining (~4 steps)\n[Step 3] Commit 7e91f0b -> pytest FAIL\n[Groq AI] Culprit localized in 1.12s`,
      },
    },
    {
      step: "03",
      title: "Review Diff & Approve Safety Gate",
      subtitle: "Strict human sign-off before applying fixes",
      description:
        "Inspect the proposed code patch in the visual diff viewer. When satisfied with the sandbox test results, click Approve to apply the fix with full confidence.",
      icon: ShieldCheck,
      codePreview: {
        title: "diff-worker.py",
        snippet: `@@ -42,7 +42,9 @@ def acquire(self):\n-   self.mutex.acquire()\n+   with self.mutex:\n+       return self.queue.pop()\n✓ 42/42 tests passing in sandbox`,
      },
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-20 md:py-28 border-t border-slate-800 bg-[#060a14]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            <Terminal className="h-3.5 w-3.5 text-purple-400" />
            <span>Step-by-Step Workflow</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            From broken test to verified patch in three steps
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Eliminate tedious manual git bisect commands with an end-to-end automated
            agent lifecycle.
          </p>
        </div>

        {/* 3-Step Pipeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0f172a] p-6 transition-all hover:border-slate-700 shadow-lg"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black text-slate-600">
                      {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-xs font-semibold text-blue-400 mt-0.5">
                    {item.subtitle}
                  </p>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Code / Visual Preview Box */}
                <div className="mt-6 rounded-xl border border-slate-800/90 bg-[#050811] p-3.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-500 border-b border-slate-800 pb-2 mb-2">
                    <span>{item.codePreview.title}</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    </div>
                  </div>
                  <pre className="text-slate-300 overflow-x-auto terminal-scrollbar leading-relaxed whitespace-pre">
                    {item.codePreview.snippet}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
