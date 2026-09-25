"use client";

import { Github, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/workspace");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-3 text-sm text-slate-400">Loading workspace...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold tracking-tight">Bisect Agent Workspace</h1>
      <p className="mt-2 text-slate-400">Developer Cockpit</p>
      <button
        type="button"
        onClick={login}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        <Github className="h-4 w-4" />
        Sign in with GitHub
      </button>
    </main>
  );
}
