import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSession } from '../features/auth/hooks/use-session'
import { useAuth } from '../features/auth/hooks/use-auth'
import { Shield, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { AppShell } from '../features/layout/AppShell'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session, isPending } = useSession()
  const { signOut, isLoading: isSigningOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/login' })
    }
  }, [session, isPending, navigate])

  if (isPending) {
    return (
      <AppShell>
        <div className="flex flex-col justify-center items-center gap-4 min-h-[calc(100vh-12rem)] text-slate-400">
          <div className="border-2 border-cyan-400 border-t-transparent rounded-full w-8 h-8 animate-spin" />
          <p className="text-sm">Loading session...</p>
        </div>
      </AppShell>
    )
  }

  if (!session) {
    return null
  }

  const { user } = session

  return (
    <AppShell>
      <div className="flex justify-center items-center px-6 py-16 min-h-[calc(100vh-12rem)]">
        <div className="bg-slate-900/70 shadow-[0_30px_90px_rgba(2,8,23,0.55)] backdrop-blur-xl p-8 border border-white/10 rounded-[2rem] w-full max-w-xl">
          <div className="flex sm:flex-row flex-col items-center sm:items-center gap-6 pb-6 border-white/10 border-b">
            <div className="flex justify-center items-center bg-gradient-to-br from-cyan-500 via-sky-500 to-violet-600 shadow-[0_20px_40px_rgba(34,211,238,0.22)] rounded-2xl w-20 h-20 font-bold text-white text-3xl">
              {user.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : user.email[0].toUpperCase()}
            </div>
            <div className="sm:text-left text-center">
              <h1 className="font-semibold text-white text-2xl">{user.name || 'N/A'}</h1>
              <p className="mt-1 text-slate-400 text-sm">User profile</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-400/10 px-2.5 py-1 border border-emerald-400/20 rounded-full font-semibold text-[10px] text-emerald-300 uppercase tracking-[0.25em]">
                    <Shield className="w-3 h-3" />
                    Verified email
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 border border-amber-400/20 rounded-full font-semibold text-[10px] text-amber-300 uppercase tracking-[0.25em]">
                    <ShieldAlert className="w-3 h-3" />
                    Unverified email
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 mt-8">
            <h3 className="font-semibold text-slate-400 text-sm uppercase tracking-[0.25em]">Account information</h3>
            <div className="gap-4 grid sm:grid-cols-2">
              <div className="bg-slate-950/60 p-4 border border-white/10 rounded-2xl">
                <p className="font-semibold text-[10px] text-slate-500 uppercase tracking-[0.25em]">Email address</p>
                <p className="mt-2 text-slate-200 text-sm truncate">{user.email}</p>
              </div>
              <div className="bg-slate-950/60 p-4 border border-white/10 rounded-2xl">
                <p className="font-semibold text-[10px] text-slate-500 uppercase tracking-[0.25em]">Account created</p>
                <p className="mt-2 text-slate-200 text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-row flex-col justify-between items-center gap-3 mt-8 pt-4 border-white/10 border-t">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <Link to="/" className="hover:text-white transition">Back to home</Link>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              disabled={isSigningOut}
              className="flex justify-center items-center gap-2 bg-rose-400/10 hover:bg-rose-400/20 px-5 py-2.5 border border-rose-400/20 rounded-full w-full sm:w-auto font-semibold text-rose-300 text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
