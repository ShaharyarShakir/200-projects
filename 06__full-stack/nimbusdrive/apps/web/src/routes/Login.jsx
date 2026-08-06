import React, { useState, useEffect } from "react";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../lib/component/ui/Card";
import { Input } from "../lib/component/ui/Input";
import { Button } from "../lib/component/ui/Button";
import { useAuthStore } from "../features/auth/authStore";
import client from "../api/client";

export default function Login() {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await client.post("/api/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate({ to: "/dashboard" });
    },
    onError: (err) => {
      const serverMessage = err.response?.data?.message || "Failed to log in";
      setErrorMsg(serverMessage);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="p-8 border-slate-800/80 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center space-y-2 p-0 mb-6">
          <div className="inline-flex bg-teal-500/10 p-3 rounded-xl border border-teal-500/20 mx-auto">
            <Lock className="w-6 h-6 text-teal-400 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Please log in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900/50 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500/50 focus:ring-teal-500/20"
                disabled={loginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900/50 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500/50 focus:ring-teal-500/20"
                disabled={loginMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 font-semibold mt-2 flex justify-center items-center gap-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
