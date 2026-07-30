import Avatar from "./ui/Avatar";
import { useAuthStore } from "../store/authStore";
import useThemeStore from "../store/theme.store";
import { logoutUser } from "../services/auth.service";
import Button from "./ui/Button";
import { Sun, Moon, LogOut } from "lucide-react";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { dark, toggle } = useThemeStore();

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-colors shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-lg hidden sm:block">
          Project Workspace
        </h2>
        <WorkspaceSwitcher />
      </div>

      <div className="flex items-center gap-6">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Toggle Dark Mode"
          aria-label="Toggle Dark Mode"
        >
          {dark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} />
          <div className="hidden md:flex flex-col">
            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
              {user?.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {user?.role || "Member"}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-slate-300 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
}
