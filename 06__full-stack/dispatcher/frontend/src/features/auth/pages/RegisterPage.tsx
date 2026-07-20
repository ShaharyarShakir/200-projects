import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../../../lib/api';
import { z } from 'zod';
import { UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onNavigateLogin }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const { fieldErrors: errors } = result.error.flatten();
      setFieldErrors({
        email: errors.email?.[0] || '',
        password: errors.password?.[0] || '',
        first_name: errors.first_name?.[0] || '',
        last_name: errors.last_name?.[0] || '',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      login(response.data.tokens, response.data.user);
      onSuccess();
    } catch (err: any) {
      const errRes = err.response?.data;
      if (errRes && typeof errRes === 'object') {
        if (errRes.email) {
          setFieldErrors({ email: errRes.email[0] });
        } else {
          setErrorMsg(errRes.detail || errRes.error || 'Registration failed.');
        }
      } else {
        setErrorMsg('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-neutral-50/90 border border-neutral-200 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-brand-50 border border-brand-200 rounded-2xl text-brand-600 mb-3">
          <UserPlus className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Create Account</h2>
        <p className="text-sm text-neutral-400 mt-1">Join Dispatcher HOS & Route Planner</p>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-error-50 border border-error-200 rounded-xl p-3 text-xs text-error-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-error-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5">
              First Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
              />
            </div>
            {fieldErrors.first_name && (
              <p className="text-error-600 text-[11px] mt-1">{fieldErrors.first_name}</p>
            )}
          </div>

          <div>
            <label className="font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5">
              Last Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
              />
            </div>
            {fieldErrors.last_name && (
              <p className="text-error-600 text-[11px] mt-1">{fieldErrors.last_name}</p>
            )}
          </div>
        </div>

        <div>
          <label className="font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="driver@example.com"
              className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-error-600 text-[11px] mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label className="font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 6 characters"
              className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
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
          Register & Continue
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-neutral-400 pt-4 border-t border-neutral-200">
        Already have an account?{' '}
        <button
          onClick={onNavigateLogin}
          className="text-brand-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
