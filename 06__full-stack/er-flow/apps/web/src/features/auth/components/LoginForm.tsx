import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export function LoginForm() {
  const { signIn, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !password) {
      setValidationError("Please fill in all fields.");
      return;
    }

    try {
      await signIn({ email, password });
    } catch {
      // Handled by useAuth error state
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="text-sm text-slate-400">
          Enter your credentials to access your workspace
        </p>
      </div>

      {(error || validationError) && (
        <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm px-4 py-2.5 rounded-lg">
          {validationError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
