import React from 'react';
import { useAuth } from '../features/auth/context/AuthContext';
import { Truck, LayoutDashboard, Route, History, User as UserIcon, LogOut, LogIn, UserPlus, FileSpreadsheet, Clock } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-neutral-200 bg-neutral-50/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 bg-transparent border-0 cursor-pointer text-left"
        >
          <div className="p-2 bg-brand-600 rounded-xl shadow-lg shadow-brand-600/30 text-neutral-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 tracking-tight leading-tight">
              Trip Planner
            </h1>
            <p className="text-[11px] text-brand-600 font-medium">HOS & ELD Dispatcher</p>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-brand-50 text-brand-600 border border-brand-300'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => onNavigate('route-planner')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentView === 'route-planner'
                ? 'bg-brand-50 text-brand-600 border border-brand-300'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Route className="w-4 h-4" />
            New Trip
          </button>

          <button
            onClick={() => onNavigate('hos-engine')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentView === 'hos-engine'
                ? 'bg-brand-50 text-brand-600 border border-brand-300'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-600" />
            HOS & ELD Logs
          </button>

          <button
            onClick={() => onNavigate('trip-history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentView === 'trip-history'
                ? 'bg-brand-50 text-brand-600 border border-brand-300'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <History className="w-4 h-4" />
            Trip History
          </button>
        </nav>

        {/* User / Auth Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200">
                <UserIcon className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-semibold text-neutral-800">
                  {user?.first_name || user?.email.split('@')[0]}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-error-50 text-neutral-600 hover:text-error-600 border border-neutral-200 hover:border-error-300 text-xs font-medium transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  currentView === 'login'
                    ? 'bg-brand-600 text-neutral-0 border-brand-500'
                    : 'bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  currentView === 'register'
                    ? 'bg-brand-600 text-neutral-0 border-brand-500'
                    : 'bg-brand-50 text-brand-600 border-brand-300 hover:bg-brand-100'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
