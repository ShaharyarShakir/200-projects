import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth, SignupPage as FeatureSignupPage } from "../features/auth";

export const Route = createFileRoute("/signup")({
  component: SignupPageRoute,
});

function SignupPageRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirected.current = false;
      return;
    }

    if (!isLoading && isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate({ to: "/dashboard", replace: true }).catch(() => {
        hasRedirected.current = false;
      });
    }
  }, [isLoading, isAuthenticated, navigate]);

  return <FeatureSignupPage />;
}
