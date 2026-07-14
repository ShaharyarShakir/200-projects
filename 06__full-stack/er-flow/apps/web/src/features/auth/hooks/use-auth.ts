import { useState } from "react";
import { authClient } from "../../../lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import type { SignUpInput, SignInInput } from "@eraser/auth/schema";

export function useAuth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (data: SignUpInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      if (signUpError) {
        throw new Error(signUpError.message || "Failed to sign up");
      }
      navigate({ to: "/login" });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (data: SignInInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        throw new Error(signInError.message || "Failed to sign in");
      }
      navigate({ to: "/profile" });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.signOut();
      navigate({ to: "/login" });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    isLoading,
    error,
  };
}
