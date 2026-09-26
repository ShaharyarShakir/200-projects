"use client";

import Link from "next/link";
import { Github, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

export function CtaBanner() {
  const { isAuthenticated, login } = useAuth();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden border-t border-slate-800 bg-[#070c17]">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
          <Zap className="h-3.5 w-3.5 text-blue-400 fill-blue-400" />
          <span>Get Started in Under 60 Seconds</span>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Ready to eliminate manual git bisecting?
        </h2>

        <p className="mx-auto max-w-2xl text-base text-slate-300 leading-relaxed">
          Connect your GitHub repository and experience the power of automated
          regression isolation, Groq sub-second AI inference, and secure container
          sandboxing.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {isAuthenticated ? (
            <Link
              href="/workspace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Sparkles className="h-4 w-4" />
              Launch Workspace Cockpit
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={login}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Github className="h-4 w-4" />
              Sign in with GitHub
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Github className="h-4 w-4" />
            Star on GitHub
          </a>
        </div>

        <div className="pt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Open Source (MIT)</span>
          </div>
          <span>•</span>
          <div>Zero Setup Required</div>
          <span>•</span>
          <div>Container Sandboxed</div>
        </div>
      </div>
    </section>
  );
}
