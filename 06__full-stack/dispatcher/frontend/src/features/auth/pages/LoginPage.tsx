import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../../../lib/api';
import { z } from 'zod';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onNavigateRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const { fieldErrors: errors } = result.error.flatten();
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.tokens, response.data.user);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-neutral-50/90 border border-neutral-200 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-brand-50 border border-brand-200 rounded-2xl text-brand-600 mb-3">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Welcome Back</h2>
        <p className="text-sm text-neutral-400 mt-1">Sign in to your Dispatcher account</p>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-error-50 border border-error-200 rounded-xl p-3 text-xs text-error-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-error-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@example.com"
              className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-error-600 text-[11px] mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
            />
          </div>
          {fieldErrors.password && (
            <p className="text-error-600 text-[11px] mt-1">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-neutral-0 font-semibold py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-neutral-400 pt-4 border-t border-neutral-200">
        Don't have an account?{' '}
        <button
          onClick={onNavigateRegister}
          className="text-brand-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};
