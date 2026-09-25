"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ListFilter,
  Layers,
  Search,
  Bot,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  PlayCircle,
} from "lucide-react";

interface ArchivedSession {
  id: string;
  taskPrompt: string;
  model: string;
  provider: "Anthropic" | "OpenAI" | "Google" | "Ollama";
  status: "completed" | "failed" | "running" | "timed_out";
  iterationCount: number;
  totalTokens: number;
  durationSeconds: number;
  createdAt: string;
  repoName: string;
}

const SAMPLE_ARCHIVED_SESSIONS: ArchivedSession[] = [
  {
    id: "sess-8f12a",
    taskPrompt: "Bisect failing assertion in tests/test_engine.py between v1.2.0 and HEAD",
    model: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    status: "completed",
    iterationCount: 5,
    totalTokens: 4210,
    durationSeconds: 42.8,
    createdAt: "20 minutes ago",
    repoName: "octocat/bisect-demo",
  },
  {
    id: "sess-7e09b",
    taskPrompt: "Diagnose streaming timeout recovery in agent execution loop",
    model: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    status: "completed",
    iterationCount: 3,
    totalTokens: 2850,
    durationSeconds: 24.1,
    createdAt: "1 hour ago",
    repoName: "octocat/bisect-demo",
  },
  {
    id: "sess-6d88c",
    taskPrompt: "Inspect package dependencies and Podman container socket permission",
    model: "Llama 3.3 (Ollama)",
    provider: "Ollama",
    status: "failed",
    iterationCount: 2,
    totalTokens: 1420,
    durationSeconds: 15.6,
    createdAt: "3 hours ago",
    repoName: "octocat/bisect-demo",
  },
  {
    id: "sess-5c77d",
    taskPrompt: "Generate candidate patch for mock session timeout recovery test",
    model: "GPT-4o (Codex)",
    provider: "OpenAI",
    status: "completed",
    iterationCount: 4,
    totalTokens: 3100,
    durationSeconds: 31.2,
    createdAt: "5 hours ago",
    repoName: "octocat/bisect-demo",
  },
];

export default function SessionsPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const filteredSessions = SAMPLE_ARCHIVED_SESSIONS.filter((session) => {
    const matchesSearch =
      session.taskPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.repoName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || session.status === statusFilter;

    const matchesProvider =
      providerFilter === "all" || session.provider === providerFilter;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Sessions
            </h1>
            <p className="text-sm text-slate-400">
              Historical archive of autonomous agent runs, bisect traces, and token telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
              Total Runs: {SAMPLE_ARCHIVED_SESSIONS.length}
            </span>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by prompt, session ID, or repository..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ListFilter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>

            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Providers</option>
              <option value="Anthropic">Anthropic</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Ollama">Ollama (Local)</option>
            </select>
          </div>
        </div>

        {/* Sessions Table / List */}
        {filteredSessions.length > 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-[#0b1220] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Session & Objective</th>
                    <th className="px-4 py-3">Model / Router</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Iterations</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {session.id}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {session.repoName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">
                          {session.taskPrompt}
                        </p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-sans">
                          <Bot className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-200 text-xs">{session.model}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{session.provider}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-sans">
                        {session.status === "completed" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                        {session.status === "failed" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-800/60 bg-rose-950/40 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                        {session.status === "running" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-800/60 bg-blue-950/40 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 animate-pulse">
                            <PlayCircle className="h-3 w-3" />
                            Running
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        {session.iterationCount} steps
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        {session.totalTokens.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {session.durationSeconds}s
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap font-sans">
                        <Link
                          href="/workspace"
                          className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
                        >
                          Inspect <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
            <EmptyState
              icon={Layers}
              title="No Matching Sessions Found"
              description="No archived agent sessions match your search and filter criteria. Adjust your filters or dispatch a new task from Workspace."
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
