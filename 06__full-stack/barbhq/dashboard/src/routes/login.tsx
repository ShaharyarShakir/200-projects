import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth, LoginPage as FeatureLoginPage } from "../features/auth";

export const Route = createFileRoute("/login")({
  component: LoginPageRoute,
});

function LoginPageRoute() {
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

  return <FeatureLoginPage />;
}
