import { createFileRoute, Link } from '@tanstack/react-router'
import { useHealth } from '../features/health/use-health'
import {
  Activity,
  CheckCircle2,
  Database,
  Server,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  BookOpen,
  Sparkles,
  Zap,
  Users,
  PenTool,
  Workflow,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { useSession } from '../features/auth/hooks/use-session'
import { AppShell } from '../features/layout/AppShell'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const { isLoading: healthLoading, isError: healthError, refetch, isRefetching } = useHealth()
  const { data: session } = useSession()
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  return (
    <AppShell className="px-0 py-0">
      <div className="relative overflow-x-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_50%,transparent_100%)]" />

        <main className="relative flex flex-col gap-10 mx-auto px-6 lg:px-8 py-14 lg:py-20 max-w-7xl">
          <section className="lg:items-center gap-8 grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-slate-900/70 shadow-[0_30px_90px_rgba(2,8,23,0.55)] backdrop-blur-xl p-8 sm:p-10 border border-white/10 rounded-[2rem]">
              <div className="inline-flex items-center gap-2 bg-cyan-400/10 px-3 py-1 border border-cyan-400/25 rounded-full font-medium text-cyan-200 text-sm">
                <Sparkles className="w-4 h-4" />
                New: collaborative docs + whiteboards in one flow
              </div>
              <div className="space-y-4 mt-6">
                <h1 className="font-semibold text-white text-4xl sm:text-5xl tracking-tight">
                  Design, document, and collaborate in a single polished workspace.
                </h1>
                <p className="max-w-2xl text-slate-400 text-lg leading-8">
                  ER Flow gives technical teams a fluid place to sketch systems, write product notes, and keep every visual artifact connected in real time.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                {!session ? (
                  <>
                    <Link to="/register" className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 px-5 py-3 rounded-full font-semibold text-slate-950 text-sm transition">
                      Start free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link to="/login" className="px-5 py-3 border border-white/10 hover:border-cyan-400/40 rounded-full font-semibold text-slate-300 hover:text-white text-sm transition">
                      Sign in
                    </Link>
                  </>
                ) : (
                  <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 px-5 py-3 rounded-full font-semibold text-slate-950 text-sm transition">
                    Open workspace
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-8 text-slate-400 text-sm">
                <span className="flex items-center gap-2 bg-emerald-400/10 px-3 py-1.5 border border-emerald-400/20 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  Secure auth ready
                </span>
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/10 rounded-full">
                  <Workflow className="w-4 h-4 text-cyan-300" />
                  Live collaboration workspace
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 shadow-[0_20px_70px_rgba(8,15,35,0.4)] p-8 border border-white/10 rounded-[2rem]">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-slate-400 text-sm uppercase tracking-[0.25em]">Quick access</p>
                  <div className="bg-cyan-400/10 px-3 py-1 border border-cyan-400/20 rounded-full font-medium text-cyan-200 text-xs">Preview routes</div>
                </div>
                <div className="gap-3 grid">
                  <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="flex justify-between items-center bg-white/5 hover:bg-cyan-400/10 p-4 border border-white/10 hover:border-cyan-400/30 rounded-2xl transition">
                    <span className="flex items-center gap-3 font-medium text-slate-200 text-sm">
                      <PenTool className="w-4 h-4 text-cyan-300" />
                      Workspace editor
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link to="/about" className="flex justify-between items-center bg-white/5 hover:bg-cyan-400/10 p-4 border border-white/10 hover:border-cyan-400/30 rounded-2xl transition">
                    <span className="flex items-center gap-3 font-medium text-slate-200 text-sm">
                      <Layers className="w-4 h-4 text-cyan-300" />
                      About experience
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link to="/profile" className="flex justify-between items-center bg-white/5 hover:bg-cyan-400/10 p-4 border border-white/10 hover:border-cyan-400/30 rounded-2xl transition">
                    <span className="flex items-center gap-3 font-medium text-slate-200 text-sm">
                      <BookOpen className="w-4 h-4 text-cyan-300" />
                      Profile and session state
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {session && (
            <section className="bg-slate-900/70 shadow-[0_20px_70px_rgba(8,15,35,0.35)] backdrop-blur-xl p-8 border border-white/10 rounded-[2rem]">
              <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
                <div>
                  <p className="font-semibold text-cyan-200 text-sm uppercase tracking-[0.25em]">Welcome back</p>
                  <h2 className="mt-2 font-semibold text-white text-2xl">{session.user.name || 'Collaborator'}</h2>
                  <p className="mt-2 text-slate-400 text-sm">Jump back into the workspace or open the shared editor to keep momentum going.</p>
                </div>
                <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="inline-flex justify-center items-center gap-2 bg-cyan-500 hover:bg-cyan-400 px-5 py-3 rounded-full font-semibold text-slate-950 text-sm transition">
                  Continue working
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )}

          <section className="gap-6 grid md:grid-cols-3">
            <div className="bg-slate-900/60 shadow-[0_12px_40px_rgba(2,8,23,0.3)] p-6 border border-white/10 rounded-3xl">
              <Zap className="w-5 h-5 text-cyan-300" />
              <h3 className="mt-4 font-semibold text-white text-lg">Instant sync</h3>
              <p className="mt-2 text-slate-400 text-sm leading-7">Text and canvas updates stay aligned so your team can move without losing context.</p>
            </div>
            <div className="bg-slate-900/60 shadow-[0_12px_40px_rgba(2,8,23,0.3)] p-6 border border-white/10 rounded-3xl">
              <Users className="w-5 h-5 text-cyan-300" />
              <h3 className="mt-4 font-semibold text-white text-lg">Shared awareness</h3>
              <p className="mt-2 text-slate-400 text-sm leading-7">Collaborative cursors and live state make the experience feel immediate and guided.</p>
            </div>
            <div className="bg-slate-900/60 shadow-[0_12px_40px_rgba(2,8,23,0.3)] p-6 border border-white/10 rounded-3xl">
              <CheckCircle2 className="w-5 h-5 text-cyan-300" />
              <h3 className="mt-4 font-semibold text-white text-lg">Checkpoint history</h3>
              <p className="mt-2 text-slate-400 text-sm leading-7">Save snapshots and restore earlier versions on demand from the workspace surface.</p>
            </div>
          </section>

          <section className="bg-slate-900/60 shadow-[0_20px_70px_rgba(8,15,35,0.3)] backdrop-blur-xl p-8 border border-white/10 rounded-[2rem]">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-300" />
                <h2 className="font-semibold text-white text-lg">System health</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnostics((value) => !value)}
                className="bg-white/5 px-4 py-2 border border-white/10 hover:border-cyan-400/40 rounded-full font-medium text-slate-300 hover:text-white text-sm transition"
              >
                {showDiagnostics ? 'Hide diagnostics' : 'Show diagnostics'}
              </button>
            </div>

            {showDiagnostics && (
              <div className="space-y-6 mt-8">
                <div className="flex justify-between items-center bg-emerald-400/10 px-4 py-3 border border-emerald-400/20 rounded-2xl text-emerald-200 text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>All services are responding normally.</span>
                  </div>
                  <button type="button" onClick={() => refetch()} disabled={isRefetching} className="flex items-center gap-2 hover:bg-emerald-400/10 disabled:opacity-50 px-3 py-1.5 border border-emerald-400/20 rounded-full font-semibold text-xs transition">
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {healthLoading ? (
                  <div className="bg-slate-950/70 p-8 border border-white/10 rounded-2xl text-slate-400 text-sm text-center">Checking API health…</div>
                ) : healthError ? (
                  <div className="bg-rose-400/10 p-4 border border-rose-400/20 rounded-2xl text-rose-200 text-sm">The gateway is currently unreachable. Please make sure the API server is running.</div>
                ) : (
                  <div className="gap-4 grid md:grid-cols-3">
                    <div className="bg-slate-950/70 p-5 border border-white/10 rounded-2xl">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-semibold text-[11px] uppercase tracking-[0.25em]">Gateway</span>
                        <Server className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div className="space-y-2 mt-4 text-slate-200 text-sm">
                        <div className="flex justify-between items-center"><span>API status</span><span className="text-emerald-300">Healthy</span></div>
                        <div className="flex justify-between items-center"><span>Latency</span><span className="text-slate-300">Low</span></div>
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-5 border border-white/10 rounded-2xl">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-semibold text-[11px] uppercase tracking-[0.25em]">Database</span>
                        <Database className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div className="space-y-2 mt-4 text-slate-200 text-sm">
                        <div className="flex justify-between items-center"><span>MongoDB</span><span className="text-emerald-300">Connected</span></div>
                        <div className="flex justify-between items-center"><span>Storage</span><span className="text-slate-300">Available</span></div>
                      </div>
                    </div>
                    <div className="bg-slate-950/70 p-5 border border-white/10 rounded-2xl">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-semibold text-[11px] uppercase tracking-[0.25em]">Realtime</span>
                        <Cpu className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div className="space-y-2 mt-4 text-slate-200 text-sm">
                        <div className="flex justify-between items-center"><span>CRDT sync</span><span className="text-emerald-300">Active</span></div>
                        <div className="flex justify-between items-center"><span>Canvas engine</span><span className="text-slate-300">Operational</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </AppShell>
  )
}
