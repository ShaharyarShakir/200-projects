import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../features/auth";
import { useNavigate } from "@tanstack/react-router";
import { Avatar } from "../ui/avatar";
import { User as UserIcon, Settings, LogOut, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export const ProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.name || (user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ""}` : "Shop Manager";

  const handleAction = (path: string) => {
    navigate({ to: path });
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-secondary transition-all cursor-pointer focus:outline-none"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <Avatar
          src={user?.avatar}
          name={displayName}
          size="sm"
        />
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen ? "rotate-180" : "",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-scale-in dark:shadow-black/40 origin-top-right">
          <div className="px-3.5 py-3 border-b border-border/50 mb-1.5 flex gap-3 items-center select-none">
            <Avatar
              src={user?.avatar}
              name={displayName}
              size="md"
            />
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm text-foreground truncate">
                {displayName}
              </h4>
              <span className="inline-block text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary tracking-wide leading-none mt-1">
                {user?.role || "OWNER"}
              </span>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {user?.email || "owner@barbhq.com"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleAction("/settings")}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all font-semibold text-foreground hover:bg-secondary cursor-pointer"
            >
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>My Profile</span>
            </button>
            <button
              onClick={() => handleAction("/settings")}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all font-semibold text-foreground hover:bg-secondary cursor-pointer"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Account Settings</span>
            </button>
            <div className="h-px bg-border/50 my-1" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfileMenu;
