"use client";

import { Menu, LogOut, Github, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, isAuthenticated, logout, login } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-[#090d16]/90 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-blue-400" />
          <span className="text-lg font-semibold tracking-tight text-slate-100">
            BISect
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.github_username}
                  className="h-7 w-7 rounded-full border border-slate-700"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-300">
                  {user.github_username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-slate-300">{user.github_username}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300",
                "hover:bg-slate-800 hover:text-white"
              )}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={login}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Github className="h-4 w-4" />
            Sign in with GitHub
          </button>
        )}
      </div>
    </header>
  );
}
