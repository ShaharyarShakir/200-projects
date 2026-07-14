import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { useSession } from "../hooks/use-session";
import { User, LogOut, ChevronDown, Settings } from "lucide-react";

export function UserMenu() {
  const { data: session } = useSession();
  const { signOut, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!session?.user) {
    return null;
  }

  const { user } = session;
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 hover:bg-slate-800/40 rounded-xl border border-transparent hover:border-slate-800/60 transition-all cursor-pointer"
      >
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/10">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-slate-200 leading-tight">
            {user.name || "User"}
          </p>
          <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
            {user.email}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-800/80 bg-slate-950/90 backdrop-blur-md p-1.5 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="px-3 py-2 border-b border-slate-900 mb-1.5">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 rounded-lg transition-colors cursor-pointer text-left"
            >
              <User className="h-3.5 w-3.5 text-slate-500" />
              My Profile
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 rounded-lg transition-colors cursor-pointer text-left"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              Settings
            </button>
          </div>

          <div className="border-t border-slate-900 my-1.5" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            disabled={isLoading}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isLoading ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}
