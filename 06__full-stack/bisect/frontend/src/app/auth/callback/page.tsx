"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { TokenResponse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/useAuth";
import {
  DEFAULT_AUTHENTICATED_PATH,
  safeNextPath,
} from "@/lib/auth/routes";
import { returnPathStorage } from "@/lib/api/client";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuthData } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const exchangePromiseRef = useRef<Promise<TokenResponse> | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    // `next` is attacker-controllable, so it is validated before use. A missing
    // or rejected value falls back to the return path recorded on 401, then to
    // the default landing page.
    const requestedNext = safeNextPath(searchParams.get("next"));
    const destination =
      requestedNext ?? returnPathStorage.get() ?? DEFAULT_AUTHENTICATED_PATH;

    if (!code || !state) {
      setError("Missing code or state parameter from GitHub OAuth callback.");
      setIsProcessing(false);
      return;
    }

    let isMounted = true;

    if (!exchangePromiseRef.current) {
      exchangePromiseRef.current = authApi.handleCallback(code, state);
    }

    async function exchangeToken() {
      try {
        const response = await exchangePromiseRef.current!;
        if (isMounted) {
          setAuthData(response.access_token, response.user);
          returnPathStorage.clear();
          router.replace(destination);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to authenticate with GitHub";
          setError(msg);
          setIsProcessing(false);
        }
      }
    }

    exchangeToken();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, setAuthData]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <h2 className="text-xl font-semibold text-slate-100">
          Authenticating with GitHub...
        </h2>
        <p className="text-sm text-slate-400">
          Exchanging authorization code and setting up your workspace session.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex max-w-md flex-col items-center justify-center space-y-4 rounded-xl border border-red-900/50 bg-red-950/20 p-8 text-center text-slate-200 shadow-xl">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-bold text-red-200">Authentication Failed</h2>
        <p className="text-sm text-red-300/80">{error}</p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
