"use client";

import Link from "next/link";
import {
  Github,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { HeroTerminal } from "./HeroTerminal";

export function HeroSection() {
  const { isAuthenticated, login } = useAuth();

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Glows & Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-300 shadow-sm">
              <Zap className="h-3.5 w-3.5 text-blue-400 fill-blue-400" />
              <span>Groq Ultra-Fast AI & Podman Sandboxes</span>
              <span className="hidden sm:inline text-blue-400/50">•</span>
              <span className="hidden sm:inline text-slate-300">Bisect v0.1</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Automate <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Regression Isolation
              </span>{" "}
              with Git Bisect AI
            </h1>

            {/* Sub-headline */}
            <p className="text-base text-slate-300 sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Stop wasting engineering hours manually bisecting broken commits.
              Bisect runs your test suites inside isolated Podman containers,
              pinpoints the exact culprit commit in seconds with Groq AI, and
              generates verified patches under strict human approval.
            </p>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
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
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Terminal className="h-4 w-4 text-blue-400" />
                See How It Works
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero Host Contamination</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Human Approval Barrier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-blue-400" />
                <span>Sub-Second Groq Reasoning</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Cockpit Terminal Preview */}
          <div className="lg:col-span-6 w-full">
            <HeroTerminal />
          </div>
        </div>
      </div>
    </section>
  );
}
