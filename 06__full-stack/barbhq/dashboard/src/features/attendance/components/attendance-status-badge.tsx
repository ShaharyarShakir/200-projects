import React from "react";
import type { AttendanceStatusType } from "../attendance.types";
import { CheckCircle2, Clock, AlertCircle, XCircle, MinusCircle, UserCheck } from "lucide-react";

interface AttendanceStatusBadgeProps {
  status: AttendanceStatusType;
  className?: string;
  showIcon?: boolean;
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  className = "",
  showIcon = true,
}) => {
  let badgeStyle = "bg-muted/60 text-muted-foreground border-muted";
  let icon = <MinusCircle className="h-3.5 w-3.5" />;
  let label = "Not Started";

  switch (status) {
    case "WORKING":
      badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      icon = <Clock className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />;
      label = "Working";
      break;
    case "LATE":
      badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      icon = <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
      label = "Late";
      break;
    case "COMPLETED":
      badgeStyle = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      icon = <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
      label = "Done";
      break;
    case "ABSENT":
      badgeStyle = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      icon = <XCircle className="h-3.5 w-3.5 text-rose-500" />;
      label = "Absent";
      break;
    case "HALF_DAY":
      badgeStyle = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      icon = <Clock className="h-3.5 w-3.5 text-orange-500" />;
      label = "Half Day";
      break;
    case "ON_LEAVE":
      badgeStyle = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      icon = <UserCheck className="h-3.5 w-3.5 text-purple-500" />;
      label = "On Leave";
      break;
    case "NOT_STARTED":
    default:
      badgeStyle = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
      icon = <MinusCircle className="h-3.5 w-3.5 text-slate-400" />;
      label = "Not Started";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
