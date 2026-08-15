import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Calendar,
  ShieldAlert,
  Package,
  Clock,
  DollarSign,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useNotifications } from "../../features/notifications/use-notifications";
import { formatDistanceToNow } from "date-fns";

export const NotificationMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
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

  const getIcon = (type: string) => {
    switch (type) {
      case "APPOINTMENT":
        return <Calendar className="h-4.5 w-4.5 text-primary" />;
      case "INVENTORY":
        return <Package className="h-4.5 w-4.5 text-amber-500" />;
      case "ATTENDANCE":
        return <Clock className="h-4.5 w-4.5 text-blue-500" />;
      case "PAYROLL":
        return <DollarSign className="h-4.5 w-4.5 text-emerald-500" />;
      default:
        return <ShieldAlert className="h-4.5 w-4.5 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9.5 w-9.5 items-center justify-center rounded-full border border-border bg-card/50 hover:bg-secondary transition-all cursor-pointer focus:outline-none"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-primary-foreground ring-2 ring-background">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-scale-in dark:shadow-black/40 origin-top-right">
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/50 mb-1.5 select-none">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-foreground">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto flex flex-col gap-1 pr-0.5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
                No notifications found.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id || n._id}
                  onClick={() => !n.isRead && markAsRead(n.id || n._id || "")}
                  className={cn(
                    "flex gap-3 rounded-lg p-3 text-left transition-all relative border border-transparent cursor-pointer",
                    n.isRead
                      ? "hover:bg-secondary/40"
                      : "bg-primary/5 hover:bg-primary/10 border-primary/10",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/80 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground truncate pr-2">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal font-medium">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
