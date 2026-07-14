import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, PenTool, Sparkles, Workflow } from 'lucide-react'
import { AppShell } from '../features/layout/AppShell'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <AppShell>
      <section className="flex flex-col gap-10 mx-auto px-6 lg:px-8 py-16 max-w-6xl">
        <div className="lg:items-center gap-8 grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 bg-slate-900/60 shadow-[0_20px_70px_rgba(8,15,35,0.55)] backdrop-blur-xl p-8 border border-white/10 rounded-3xl">
            <div className="inline-flex items-center gap-2 bg-cyan-400/10 px-3 py-1 border border-cyan-400/25 rounded-full font-medium text-cyan-200 text-sm">
              <Sparkles className="w-4 h-4" />
              Built for modern product teams
            </div>
            <div className="space-y-4">
              <h1 className="font-semibold text-white text-4xl sm:text-5xl tracking-tight">
                A focused workspace for docs, diagrams, and fast iteration.
              </h1>
              <p className="max-w-2xl text-slate-400 text-lg leading-8">
                ER Flow brings notes, whiteboards, and shared collaboration into one polished surface so your team can move from idea to implementation without context switching.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 px-5 py-3 rounded-full font-semibold text-slate-950 text-sm transition">
                Open workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="px-5 py-3 border border-white/10 hover:border-cyan-400/40 rounded-full font-semibold text-slate-300 hover:text-white text-sm transition">
                Create account
              </Link>
            </div>
          </div>

          <div className="bg-slate-950/80 shadow-[0_20px_70px_rgba(8,15,35,0.4)] p-8 border border-white/10 rounded-3xl">
            <div className="space-y-4">
              <div className="bg-cyan-400/10 p-4 border border-cyan-400/20 rounded-2xl text-cyan-200">
                <p className="font-semibold text-sm uppercase tracking-[0.25em]">Highlights</p>
                <div className="space-y-3 mt-3 text-slate-300 text-sm">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4" />
                    Rich markdown and collaborative docs
                  </div>
                  <div className="flex items-center gap-3">
                    <PenTool className="w-4 h-4" />
                    Infinite canvas for architecture diagrams
                  </div>
                  <div className="flex items-center gap-3">
                    <Workflow className="w-4 h-4" />
                    Shared live state across editors
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
