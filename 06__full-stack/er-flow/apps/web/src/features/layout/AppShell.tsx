import { Link } from '@tanstack/react-router'
import { ArrowRight, Layers, PenTool, ChevronDown, Menu, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '../auth/hooks/use-session'
import { useState } from 'react'

type AppShellProps = {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className = '' }: AppShellProps) {
  const { data: session, isPending } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="bg-[#0f0f11] min-h-screen text-slate-100">
      <header className="top-0 z-50 sticky bg-[#0f0f11]/80 backdrop-blur-xl border-b border-[#1b1b1e]">
        <div className="flex justify-between items-center mx-auto px-6 lg:px-8 py-4 max-w-7xl">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex justify-center items-center bg-[#131416] shadow-[0_0_35px_rgba(47,104,250,0.18)] border border-white/5 rounded-2xl w-10 h-10">
              <Layers className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-sm uppercase tracking-[0.24em]">ER Flow</p>
              <p className="text-slate-500 text-xs">Collaborative design workspace</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <div className="relative group">
              <button className="flex items-center gap-1 text-slate-300 hover:text-white transition">
                Product
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#131416] border border-[#1b1b1e] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2 space-y-1">
                  <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="block px-3 py-2 rounded-md hover:bg-[#222326] hover:text-white transition">
                    Workspace
                  </Link>
                  <Link to="/about" className="block px-3 py-2 rounded-md hover:bg-[#222326] hover:text-white transition">
                    About
                  </Link>
                </div>
              </div>
            </div>
            <Link to="/about" className="text-slate-300 hover:text-white transition">
              Solutions
            </Link>
            <Link to="/about" className="text-slate-300 hover:text-white transition">
              Resources
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isPending ? (
              <div className="bg-[#131416] rounded-full w-24 h-9 animate-pulse" />
            ) : session ? (
              <>
                <Link
                  to="/workspaces/$workspaceId"
                  params={{ workspaceId: 'default' }}
                  className="hidden sm:flex items-center gap-2 bg-[#131416] hover:bg-[#17181c] px-4 py-2 border border-white/5 hover:border-white/10 rounded-full font-medium text-slate-300 text-sm transition"
                >
                  <PenTool className="w-4 h-4" />
                  Open board
                </Link>
                <Link
                  to="/profile"
                  className="bg-[#2f68fa]/10 hover:bg-[#2f68fa]/20 px-4 py-2 border border-[#2f68fa]/25 rounded-full font-medium text-[#2f68fa] text-sm transition"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block px-4 py-2 border border-white/5 hover:border-white/10 rounded-full font-medium text-slate-300 hover:text-white text-sm transition">
                  Sign in
                </Link>
                <Link to="/register" className="flex items-center gap-2 bg-[#2f68fa] hover:bg-[#1d57e6] px-4 py-2 rounded-full font-semibold text-white text-sm transition">
                  Try ER Flow
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-[#131416] transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1b1b1e] bg-[#131416]">
            <nav className="flex flex-col p-4 space-y-4">
              <Link to="/" className="text-slate-300 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="text-slate-300 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
                Workspace
              </Link>
              <Link to="/about" className="text-slate-300 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              {!session && (
                <>
                  <Link to="/login" className="text-slate-300 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
                    Sign in
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className={['flex-1', className].filter(Boolean).join(' ')}>{children}</main>

      <footer className="bg-[#131416] border-t border-[#1b1b1e]">
        <div className="mx-auto px-6 lg:px-8 py-12 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-[#131416] border border-white/5 rounded-2xl w-10 h-10">
                  <Layers className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 text-sm uppercase tracking-[0.24em]">ER Flow</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                Collaborative design workspace for technical teams to sketch systems and document in real time.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Product</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li>
                  <Link to="/workspaces/$workspaceId" params={{ workspaceId: 'default' }} className="hover:text-white transition">
                    Workspace
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white transition">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition">
                    Examples
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition">
                    Guides
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Company</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition">
                    Get started
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1b1b1e] flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
            <p>© 2024 ER Flow. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-white transition">
                Privacy
              </Link>
              <Link to="/about" className="hover:text-white transition">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
