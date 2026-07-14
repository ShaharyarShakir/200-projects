import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  PenTool,
  Workflow,
  ShieldCheck,
  GitBranch,
  FileText,
  MessageSquare,
  Play,
  Code,
  Share2,
} from 'lucide-react'
import { useSession } from '../features/auth/hooks/use-session'
import { AppShell } from '../features/layout/AppShell'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const { data: session } = useSession()

  return (
    <AppShell className="px-0 py-0">
      <div className="relative overflow-hidden">
        <main className="relative flex flex-col gap-16 mx-auto px-6 lg:px-8 py-16 lg:py-24 max-w-7xl">
          <section className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#2f68fa]/10 px-4 py-2 border border-[#2f68fa]/20 rounded-full font-medium text-[#2f68fa] text-sm">
              <Sparkles className="w-4 h-4" />
              AI-powered ER diagrams and technical design
            </div>
            <h1 className="font-semibold text-slate-100 text-5xl sm:text-6xl lg:text-7xl tracking-tight">
              Design technical diagrams at the speed of thought
            </h1>
            <p className="max-w-2xl mx-auto text-slate-400 text-lg lg:text-xl leading-8">
              ER Flow gives technical teams a fluid place to sketch systems, write documentation, and collaborate in real time. Beautiful by default, created in seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {!session ? (
                <>
                  <Link to="/register" className="flex items-center gap-2 bg-[#2f68fa] hover:bg-[#1d57e6] px-6 py-3 rounded-full font-semibold text-white text-sm transition">
                    Try ER Flow free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/login" className="px-6 py-3 border border-white/5 hover:border-white/10 rounded-full font-semibold text-slate-300 hover:text-white text-sm transition">
                    Sign in
                  </Link>
                </>
              ) : (
                <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="flex items-center gap-2 bg-[#2f68fa] hover:bg-[#1d57e6] px-6 py-3 rounded-full font-semibold text-white text-sm transition">
                  Open workspace
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 text-slate-500 text-sm">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2f68fa]" />
                Secure & SOC 2 ready
              </span>
              <span className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-[#2f68fa]" />
                Real-time collaboration
              </span>
              <span className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#2f68fa]" />
                Git integration
              </span>
            </div>
          </section>

          {session && (
            <section className="bg-[#131416] border border-[#1b1b1e] rounded-2xl p-8 shadow-lg">
              <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4">
                <div>
                  <p className="font-semibold text-[#2f68fa] text-sm uppercase tracking-wider">Welcome back</p>
                  <h2 className="mt-2 font-semibold text-slate-100 text-2xl">{session.user.name || 'Collaborator'}</h2>
                  <p className="mt-2 text-slate-400 text-sm">Jump back into your workspace and continue designing.</p>
                </div>
                <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="inline-flex justify-center items-center gap-2 bg-[#2f68fa] hover:bg-[#1d57e6] px-5 py-3 rounded-full font-semibold text-white text-sm transition">
                  Continue working
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )}

          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#131416]/40 border border-[#1b1b1e] rounded-xl p-6 hover:border-[#2f68fa]/30 transition">
              <div className="bg-[#2f68fa]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <PenTool className="w-6 h-6 text-[#2f68fa]" />
              </div>
              <h3 className="font-semibold text-slate-100 text-lg mb-2">ER Diagrams</h3>
              <p className="text-slate-400 text-sm">Visualize data models and database schemas with AI-powered generation.</p>
            </div>
            <div className="bg-[#131416]/40 border border-[#1b1b1e] rounded-xl p-6 hover:border-[#2f68fa]/30 transition">
              <div className="bg-[#2f68fa]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-[#2f68fa]" />
              </div>
              <h3 className="font-semibold text-slate-100 text-lg mb-2">Architecture</h3>
              <p className="text-slate-400 text-sm">Design system architecture and infrastructure diagrams effortlessly.</p>
            </div>
            <div className="bg-[#131416]/40 border border-[#1b1b1e] rounded-xl p-6 hover:border-[#2f68fa]/30 transition">
              <div className="bg-[#2f68fa]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-[#2f68fa]" />
              </div>
              <h3 className="font-semibold text-slate-100 text-lg mb-2">Documentation</h3>
              <p className="text-slate-400 text-sm">Write technical docs and design docs with built-in markdown editor.</p>
            </div>
            <div className="bg-[#131416]/40 border border-[#1b1b1e] rounded-xl p-6 hover:border-[#2f68fa]/30 transition">
              <div className="bg-[#2f68fa]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#2f68fa]" />
              </div>
              <h3 className="font-semibold text-slate-100 text-lg mb-2">Collaboration</h3>
              <p className="text-slate-400 text-sm">Work together in real-time with cursors, comments, and live sync.</p>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#131416]/40 border border-[#1b1b1e] rounded-xl p-6">
              <Zap className="w-5 h-5 text-[#2f68fa] mb-4" />
              <h3 className="font-semibold text-slate-100 text-lg mb-2">Instant sync</h3>
              <p className="text-slate-400 text-sm leading-7">Text and canvas updates stay aligned so your team can move without losing context.</p>
            </div>
            <div className="bg-[#131416]/40 border border-[#1b1b1e] rounded-xl p-6">
              <Users className="w-5 h-5 text-[#2f68fa] mb-4" />
              <h3 className="font-semibold text-slate-100 text-lg mb-2">Shared awareness</h3>
              <p className="text-slate-400 text-sm leading-7">Collaborative cursors and live state make the experience feel immediate and guided.</p>
            </div>
            <div className="bg-[#131416]/40 border border-[#1b1b1e] rounded-xl p-6">
              <Share2 className="w-5 h-5 text-[#2f68fa] mb-4" />
              <h3 className="font-semibold text-slate-100 text-lg mb-2">Easy sharing</h3>
              <p className="text-slate-400 text-sm leading-7">Share diagrams and docs with your team via links or embed them in your existing tools.</p>
            </div>
          </section>

          <section className="bg-[#131416]/20 border border-[#1b1b1e] rounded-2xl p-8">
            <div className="text-center space-y-6">
              <h2 className="font-semibold text-slate-100 text-2xl">Get started in minutes</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Join thousands of technical teams who use ER Flow to design, document, and collaborate faster.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register" className="flex items-center gap-2 bg-[#2f68fa] hover:bg-[#1d57e6] px-6 py-3 rounded-full font-semibold text-white text-sm transition">
                  <Play className="w-4 h-4" />
                  Start for free
                </Link>
                <Link to="/about" className="flex items-center gap-2 px-6 py-3 border border-white/5 hover:border-white/10 rounded-full font-semibold text-slate-300 hover:text-white text-sm transition">
                  <Code className="w-4 h-4" />
                  View examples
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  )
}
