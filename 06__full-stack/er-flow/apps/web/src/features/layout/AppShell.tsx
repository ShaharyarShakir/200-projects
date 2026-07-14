import { Link } from '@tanstack/react-router'
import { ArrowRight, Layers, PenTool, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '../auth/hooks/use-session'

type AppShellProps = {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className = '' }: AppShellProps) {
  const { data: session, isPending } = useSession()

  return (
    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#07111f_45%,_#020617_100%)] min-h-screen text-slate-100">
      <header className="top-0 z-50 sticky bg-slate-950/70 backdrop-blur-xl border-white/10 border-b">
        <div className="flex justify-between items-center mx-auto px-6 lg:px-8 py-4 max-w-7xl">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex justify-center items-center bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.18)] border border-cyan-400/30 rounded-2xl w-10 h-10">
              <Layers className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <p className="font-semibold text-cyan-200 text-sm uppercase tracking-[0.24em]">ER Flow</p>
              <p className="text-slate-400 text-xs">Collaborative design workspace</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-slate-300 text-sm">
            <Link to="/" className="hover:text-white transition">
              Home
            </Link>
            <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="hover:text-white transition">
              Workspace
            </Link>
            <Link to="/about" className="hover:text-white transition">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isPending ? (
              <div className="bg-white/10 rounded-full w-24 h-9 animate-pulse" />
            ) : session ? (
              <>
                <Link
                  to="/workspaces/$workspaceId"
                  params={{ workspaceId: 'default' }}
                  className="hidden sm:flex items-center gap-2 bg-white/5 hover:bg-cyan-400/10 px-4 py-2 border border-white/10 hover:border-cyan-400/40 rounded-full font-medium text-slate-200 text-sm transition"
                >
                  <PenTool className="w-4 h-4" />
                  Open board
                </Link>
                <Link
                  to="/profile"
                  className="bg-cyan-400/10 hover:bg-cyan-400/20 px-4 py-2 border border-cyan-400/25 rounded-full font-medium text-cyan-200 text-sm transition"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 border border-white/10 hover:border-cyan-400/40 rounded-full font-medium text-slate-300 hover:text-white text-sm transition">
                  Sign in
                </Link>
                <Link to="/register" className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-full font-semibold text-slate-950 text-sm transition">
                  Start free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={['flex-1', className].filter(Boolean).join(' ')}>{children}</main>

      <footer className="bg-slate-950/60 border-white/10 border-t">
        <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-4 mx-auto px-6 lg:px-8 py-8 max-w-7xl text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>Crafted for fast technical collaboration and visual thinking.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="hover:text-white transition">
              Home
            </Link>
            <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="hover:text-white transition">
              Workspace
            </Link>
            <Link to="/login" className="hover:text-white transition">
              Login
            </Link>
            <Link to="/register" className="hover:text-white transition">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
