"use client";

import Link from "next/link";
import { LayoutDashboard, Github } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#050811] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                BISect
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Developer cockpit for automated Git bisect regression localization,
              Groq AI reasoning, and Podman container sandboxing.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Product
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link href="/workspace" className="hover:text-white transition-colors">
                  Agent Workspace Cockpit
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Automated Git Bisect
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Groq Sub-Second AI
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Podman Sandboxing
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Human Safety Gate
                </a>
              </li>
            </ul>
          </div>

          {/* Architecture & Stack */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Architecture
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <span className="text-slate-300">FastAPI & Python 3.12</span>
              </li>
              <li>
                <span className="text-slate-300">Next.js 15 & React 19</span>
              </li>
              <li>
                <span className="text-slate-300">Groq LLM Engine (Llama 3.3)</span>
              </li>
              <li>
                <span className="text-slate-300">Podman Container Sandbox</span>
              </li>
              <li>
                <span className="text-slate-300">PostgreSQL & Alembic</span>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Resources
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-white transition-colors">
                  Developer Reviews
                </a>
              </li>
              <li>
                <span className="text-slate-500">API Docs (/api/v1/docs)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Bisect Project. Released under the MIT License.</p>
          <div className="flex items-center gap-4">
            <span>Built for high-velocity software teams</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
