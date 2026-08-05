/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import {
  Cloud,
  Sun,
  Moon,
  HardDrive,
  LayoutDashboard,
  Star,
  Trash2,
  LogOut,
  Info,
  Menu,
  X,
  LogIn,
  UserPlus,
} from "lucide-react";
import Dashboard from "./Dashboard";
import About from "./About";
import Drive from "./Drive";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import { Button } from "../lib/component/ui/Button";
import { useAuthStore } from "../features/auth/authStore";
import { useThemeStore } from "../features/theme/themeStore";
import { useDriveStore } from "../features/drive/driveStore";

// Format helper
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Root Route layout
function RootLayout() {
  const { user, logout, token } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { activeTab, setActiveTab } = useDriveStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Effect to toggle dark class on root document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    navigate({ to: "/drive" });
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate({ to: "/login" });
  };

  const location = useLocation();

  // Responsive storage calculations
  const storageUsed = user?.storageUsed || 0;
  const storageQuota = user?.storageQuota || 5368709120;
  const usedPercentage = Math.min((storageUsed / storageQuota) * 100, 100);

  const isAppRoute = ["/dashboard", "/drive"].includes(location.pathname);
  const showSidebar = !!token && isAppRoute;

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0f1413] dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
        {/* Top Navbar */}
        <header className="w-full bg-white dark:bg-[#0b0f0e]/95 border-b border-slate-200 dark:border-slate-800/40 sticky top-0 z-50 backdrop-blur-md transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center" title="Nimbus Drive Home">
              <div className="bg-gradient-to-tr from-teal-600 to-emerald-400 p-2 rounded-xl shadow-lg shadow-teal-500/10 hover:opacity-85 transition-opacity">
                <Cloud className="w-5 h-5 text-white" />
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/about"
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
              >
                About App
              </Link>
              {token ? (
                <>
                  <Link to="/dashboard">
                    <Button
                      variant="ghost"
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="text-xs font-bold px-4">Sign Up</Button>
                  </Link>
                </>
              )}
              <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  {theme === "dark" ? (
                    <Sun className="w-3.5 h-3.5 text-yellow-500" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800/40 py-6 px-8 text-center text-xs text-slate-500 bg-white/50 dark:bg-transparent backdrop-blur-xs">
          &copy; {new Date().getFullYear()} Nimbus Drive. Cloud storage built with React, Vite,
          Express, and Garage S3.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0f1413] dark:text-slate-100 font-sans flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0b0f0e] border-b border-slate-200 dark:border-slate-800/40 sticky top-0 z-50">
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
          title="Go to Home Page"
        >
          <div className="bg-gradient-to-tr from-teal-600 to-emerald-400 p-2 rounded-xl shadow-lg">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-teal-600 dark:from-white dark:to-teal-400">
            Nimbus
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 border-r border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0b0f0e] flex flex-col z-40 transition-transform duration-300 md:translate-x-0
          ${mobileMenuOpen ? "translate-x-0 pt-16 md:pt-0" : "-translate-x-full"}
        `}
      >
        {/* Logo Section */}
        <div className="hidden md:flex items-center px-6 py-5 border-b border-slate-100 dark:border-slate-900">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-85 transition-opacity"
            title="Go to Home Page"
          >
            <div className="bg-gradient-to-tr from-teal-600 to-emerald-400 p-2 rounded-xl shadow-lg shadow-teal-500/10">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-teal-600 dark:from-white dark:to-teal-400">
                Nimbus Drive
              </span>
              <span className="block text-[10px] text-teal-500 font-mono">v0.2.0</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
          {user ? (
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Workspace
              </span>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                activeProps={{
                  className:
                    "bg-teal-50/80 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-semibold",
                }}
                inactiveProps={{
                  className:
                    "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900",
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/drive"
                onClick={() => handleTabClick("all")}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  activeTab === "all" && window.location.pathname === "/drive"
                    ? "bg-teal-50/80 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4" />
                  <span>My Drive</span>
                </span>
              </Link>
              <button
                onClick={() => handleTabClick("starred")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left ${
                  activeTab === "starred" && window.location.pathname === "/drive"
                    ? "bg-teal-50/80 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </span>
              </button>
              <button
                onClick={() => handleTabClick("trash")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left ${
                  activeTab === "trash" && window.location.pathname === "/drive"
                    ? "bg-teal-50/80 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4" />
                  <span>Trash Bin</span>
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                Gate
              </span>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                activeProps={{
                  className: "bg-teal-50/80 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400",
                }}
                inactiveProps={{
                  className:
                    "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900",
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                activeProps={{
                  className: "bg-teal-50/80 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400",
                }}
                inactiveProps={{
                  className:
                    "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900",
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </Link>
            </div>
          )}

          <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-900">
            <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Resources
            </span>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              activeProps={{
                className:
                  "bg-teal-50/80 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-semibold",
              }}
              inactiveProps={{
                className:
                  "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900",
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
            >
              <Info className="w-4 h-4" />
              <span>About App</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-900 space-y-4">
          {/* Storage indicator */}
          {user && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900 space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <span>Storage Used</span>
                <span>{usedPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${usedPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {formatBytes(storageUsed)} of {formatBytes(storageQuota)}
              </p>
            </div>
          )}

          {/* User and Theme Control */}
          <div className="flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-2 max-w-[150px] truncate">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-teal-500/10">
                  {user.name[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {user.name}
                  </span>
                  <span className="block text-[9px] text-slate-400 truncate">{user.email}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Guest Session</span>
            )}

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
                title="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-3.5 h-3.5 text-yellow-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                )}
              </Button>

              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 transition-colors duration-200">
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/40 py-6 px-8 text-center text-xs text-slate-500 bg-white/50 dark:bg-transparent backdrop-blur-xs">
          &copy; {new Date().getFullYear()} Nimbus Drive. Cloud storage built with React, Vite,
          Express, and Garage S3.
        </footer>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

// Route definitions importing external modular components
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
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
  dashboardRoute,
  aboutRoute,
  driveRoute,
  loginRoute,
  registerRoute,
]);

export const router = createRouter({ routeTree });
