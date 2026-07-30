import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch {
      // Toast errors are already handled in the useAuth hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Login to manage your agile boards
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-650/20"
        >
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Register here
        </Link>
      </div>
    </div>
  );
}
