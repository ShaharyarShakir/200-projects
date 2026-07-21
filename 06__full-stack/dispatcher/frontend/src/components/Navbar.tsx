import React from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../features/auth/context/AuthContext';
import { Truck, LayoutDashboard, Route, History, User as UserIcon, LogOut, LogIn, UserPlus, FileSpreadsheet, Sliders } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const activeLinkClass = 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-sm';
  const inactiveLinkClass = 'text-neutral-300 hover:text-white hover:bg-neutral-800/80 border-transparent';
  const baseLinkClass = 'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border';

  return (
    <header className="border-b border-neutral-800/80 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 bg-transparent border-0 cursor-pointer text-left group"
        >
          <div className="p-2 bg-brand-600 rounded-xl shadow-lg shadow-brand-600/30 text-white group-hover:scale-105 transition-transform">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-100 tracking-tight leading-tight">
              Trip Planner
            </h1>
            <p className="text-[11px] text-brand-400 font-medium">HOS & ELD Dispatcher</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: `${baseLinkClass} ${activeLinkClass}` }}
            inactiveProps={{ className: `${baseLinkClass} ${inactiveLinkClass}` }}
          >
            <LayoutDashboard className="w-4 h-4 text-brand-400" />
            Dashboard
          </Link>

          <Link
            to="/route-planner"
            activeProps={{ className: `${baseLinkClass} ${activeLinkClass}` }}
            inactiveProps={{ className: `${baseLinkClass} ${inactiveLinkClass}` }}
          >
            <Route className="w-4 h-4 text-emerald-400" />
            New Trip
          </Link>

          <Link
            to="/route-optimization"
            activeProps={{ className: `${baseLinkClass} ${activeLinkClass}` }}
            inactiveProps={{ className: `${baseLinkClass} ${inactiveLinkClass}` }}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            Route Optimization
          </Link>

          <Link
            to="/hos-logs"
            activeProps={{ className: `${baseLinkClass} ${activeLinkClass}` }}
            inactiveProps={{ className: `${baseLinkClass} ${inactiveLinkClass}` }}
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-400" />
            HOS & ELD Logs
          </Link>

          <Link
            to="/trips"
            activeProps={{ className: `${baseLinkClass} ${activeLinkClass}` }}
            inactiveProps={{ className: `${baseLinkClass} ${inactiveLinkClass}` }}
          >
            <History className="w-4 h-4 text-sky-400" />
            Trip History
          </Link>
        </nav>

        {/* User / Auth Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700">
                <UserIcon className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-semibold text-neutral-200">
                  {user?.first_name || user?.email.split('@')[0]}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/40 text-xs font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                activeProps={{ className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border bg-brand-600 text-white border-brand-500 shadow-md" }}
                inactiveProps={{ className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750 hover:text-white" }}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
              <Link
                to="/register"
                activeProps={{ className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border bg-brand-600 text-white border-brand-500 shadow-md" }}
                inactiveProps={{ className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border bg-brand-500/10 text-brand-400 border-brand-500/30 hover:bg-brand-500/20" }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
