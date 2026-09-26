"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Github,
  Menu,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

interface LandingNavbarProps {
  onSignIn?: () => void;
}

export function LandingNavbar({ onSignIn }: LandingNavbarProps) {
  const { isAuthenticated, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      login();
    }
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Reviews", href: "#reviews" },
    { label: "Cockpit", href: "/workspace" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Status Badge */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 group-hover:bg-blue-600/30">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                BISect
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  v0.1
                </span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 font-mono tracking-wider">
                AGENT COCKPIT
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Anchor Navigation */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 backdrop-blur-sm">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
            aria-label="GitHub Repository"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>

          {isAuthenticated ? (
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Go to Workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Github className="h-3.5 w-3.5" />
              Sign in with GitHub
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-800 bg-[#0b1220] px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                href="/workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <Sparkles className="h-4 w-4" />
                Go to Workspace
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignIn();
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <Github className="h-4 w-4" />
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
