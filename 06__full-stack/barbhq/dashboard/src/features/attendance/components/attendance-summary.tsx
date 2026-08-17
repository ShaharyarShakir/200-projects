import React from "react";
import { UserCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AttendanceRecord } from "../attendance.types";

interface AttendanceSummaryProps {
  records: AttendanceRecord[];
  totalEmployeesCount?: number;
  className?: string;
}

export const AttendanceSummaryCards: React.FC<AttendanceSummaryProps> = ({
  records,
  totalEmployeesCount = 0,
  className = "",
}) => {
  const workingCount = records.filter(
    (r) => r.status === "WORKING" || (r.clockIn && !r.clockOut),
  ).length;

  const lateCount = records.filter(
    (r) => r.status === "LATE" || r.lateMinutes > 5,
  ).length;

  const completedCount = records.filter(
    (r) => r.status === "COMPLETED" || r.status === "HALF_DAY" || !!r.clockOut,
  ).length;

  const absentCount = records.filter((r) => r.status === "ABSENT").length;

  const presentTotal = workingCount + lateCount + completedCount;

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Present Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Present Today
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-black text-foreground">
            {presentTotal}
          </span>
          {totalEmployeesCount > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              / {totalEmployeesCount} staff
            </span>
          )}
        </div>
      </div>

      {/* Late Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">Late Arrivals</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <span className="text-2xl md:text-3xl font-black text-foreground">
          {lateCount}
        </span>
      </div>

      {/* Absent Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">Absent</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <span className="text-2xl md:text-3xl font-black text-foreground">
          {absentCount}
        </span>
      </div>

      {/* Clocked Out Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Clocked Out
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <span className="text-2xl md:text-3xl font-black text-foreground">
          {completedCount}
        </span>
      </div>
    </div>
  );
};
