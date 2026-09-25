"use client";

import { AuthProvider } from "@/lib/auth/useAuth";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
