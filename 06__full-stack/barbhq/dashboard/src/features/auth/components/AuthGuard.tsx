import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "../use-auth";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Button } from "../../../components/ui/button";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showFallback, setShowFallback] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      hasRedirected.current = false;
      return;
    }

    if (!isLoading && !isAuthenticated && location.pathname !== "/login" && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate({ to: "/login", replace: true }).catch(() => {
        hasRedirected.current = false;
      });
    }
  }, [isLoading, isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    if (!isLoading) {
      setShowFallback(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-3 animate-fade-in select-none">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground animate-pulse mt-2">
          Restoring Console Session
        </p>

        {showFallback && (
          <div className="flex flex-col items-center gap-2 mt-8 animate-slide-up border border-border/50 bg-card/65 backdrop-blur-md rounded-xl p-4.5 max-w-xs shadow-lg">
            <p className="text-xs text-muted-foreground text-center leading-normal">
              Server connection is taking longer than expected.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="mt-2 w-full text-xs font-semibold"
            >
              Sign In Manually
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
