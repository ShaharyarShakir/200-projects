import React from "react";
import { createRootRoute, createRoute, createRouter, Link, Outlet } from "@tanstack/react-router";
import { Cloud } from "lucide-react";
import Dashboard from "./Dashboard";
import About from "./About";
import Drive from "./Drive";
import Login from "./Login";
import Register from "./Register";
import { Button } from "../lib/component/ui/Button";
import { useAuthStore } from "../features/auth/authStore";

// Root Route layout
const rootRoute = createRootRoute({
  component: () => {
    const { user, logout } = useAuthStore();
    
    return (
      <div className="min-h-screen bg-[#0e0f14] text-slate-100 font-sans flex flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0e0f14]/80 border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-purple-500/20">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-purple-400">Nimbus Drive</span>
              <span className="ml-2 text-xs text-purple-400 font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">v0.1.0</span>
            </div>
          </div>
          <nav className="flex gap-1 items-center bg-slate-900/50 p-1 rounded-xl border border-slate-800/40">
            <Link 
              to="/" 
              activeProps={{ className: "bg-purple-600/20 text-purple-300 border-purple-500/30" }}
              inactiveProps={{ className: "hover:bg-slate-800/50 text-slate-400" }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent"
            >
              Dashboard
            </Link>
            <Link 
              to="/drive" 
              activeProps={{ className: "bg-purple-600/20 text-purple-300 border-purple-500/30" }}
              inactiveProps={{ className: "hover:bg-slate-800/50 text-slate-400" }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent"
            >
              Drive
            </Link>
            <Link 
              to="/about" 
              activeProps={{ className: "bg-purple-600/20 text-purple-300 border-purple-500/30" }}
              inactiveProps={{ className: "hover:bg-slate-800/50 text-slate-400" }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent"
            >
              About
            </Link>
          </nav>
          <div className="flex gap-4 items-center">
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-slate-300 font-medium">
                  Welcome, <span className="text-purple-400">{user.name}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 py-6 px-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Nimbus Drive. Built with React, Vite, Express, Mongoose, and Garage S3.
        </footer>
      </div>
    );
  }
});

// Route definitions importing external modular components
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: About,
});

const driveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/drive",
  component: Drive,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: Register,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  driveRoute,
  loginRoute,
  registerRoute,
]);

export const router = createRouter({ routeTree });
