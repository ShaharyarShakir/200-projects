"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { buildLoginUrl } from "@/lib/auth/routes";
import { returnPathStorage } from "@/lib/api/client";

/**
 * Guard for authenticated routes.
 *
 * Children render only once authentication has resolved, which keeps
 * protected pages from firing API calls before a token is known. The redirect
 * is issued from an effect rather than during render, because navigating
 * mid-render is a side effect React does not allow.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const shouldRedirect = !isLoading && !isAuthenticated;

  useEffect(() => {
    if (shouldRedirect) {
      // A return path recorded by a 401 is preferred: it survives the session
      // teardown that would otherwise lose the page the user was on.
      router.replace(buildLoginUrl(returnPathStorage.get() || pathname));
    }
  }, [shouldRedirect, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-3 text-sm text-slate-400">Checking your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Nothing sensitive is rendered while the redirect is in flight.
    return null;
  }

  return <>{children}</>;
}

export default RequireAuth;
