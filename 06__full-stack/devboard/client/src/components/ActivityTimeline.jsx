import { UserPlus, UserMinus, Shield, FolderKanban, HelpCircle, Clock } from "lucide-react";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";

export default function ActivityTimeline({ activities = [], loading = false }) {
  
  // Format timestamps to human readable format
  const formatTime = (timestamp) => {
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "MEMBER_ADDED":
        return { icon: UserPlus, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40" };
      case "MEMBER_REMOVED":
        return { icon: UserMinus, color: "text-rose-650 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40" };
      case "ROLE_UPDATED":
        return { icon: Shield, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40" };
      case "PROJECT_CREATED":
        return { icon: FolderKanban, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40" };
      default:
        return { icon: HelpCircle, color: "text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-805" };
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          <span>Activity History</span>
        </h3>
        <span className="text-xs text-slate-450">Updates live</span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No activity logged for this project yet.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-[400px] pr-1">
          <div className="relative pl-6 border-l border-slate-105 dark:border-slate-800 space-y-6 ml-3 py-1">
            {activities.map((activity) => {
              const { icon: Icon, color } = getActionIcon(activity.action);
              const userObj = activity.user || {};
              return (
                <div key={activity._id} className="relative group">
                  {/* Icon Indicator Node */}
                  <span className={`absolute -left-[37px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center shadow-xs shrink-0 ${color} z-10 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Avatar name={userObj.name} className="w-5 h-5 shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {userObj.name || "System"}
                        </span>
                      </div>
                      <p className="text-slate-650 dark:text-slate-350 text-xs pl-7 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-450 shrink-0 select-none">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
