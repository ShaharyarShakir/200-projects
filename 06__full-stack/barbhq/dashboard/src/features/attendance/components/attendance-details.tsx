import React from "react";
import { Clock, Calendar, AlertCircle, FileText, Coffee } from "lucide-react";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { WorkDuration } from "./work-duration";
import type { AttendanceRecord } from "../attendance.types";

interface AttendanceDetailsProps {
  record: AttendanceRecord;
  onCorrect?: () => void;
  canManage?: boolean;
  className?: string;
}

export const AttendanceDetails: React.FC<AttendanceDetailsProps> = ({
  record,
  onCorrect,
  canManage = true,
  className = "",
}) => {
  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const empName = record.employee
    ? `${record.employee.firstName} ${record.employee.lastName}`
    : "Employee";

  const scheduledStartFormatted = formatTime(record.scheduledStart);
  const scheduledEndFormatted = formatTime(record.scheduledEnd);
  const hasSchedule = scheduledStartFormatted !== "—" || scheduledEndFormatted !== "—";

  return (
    <div className={`overflow-hidden rounded-3xl border border-border bg-card shadow-xl space-y-6 p-6 md:p-8 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-xl">
            {record.employee?.avatar ? (
              <img
                src={record.employee.avatar}
                alt={empName}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              `${record.employee?.firstName?.[0] || "E"}${
                record.employee?.lastName?.[0] || ""
              }`
            )}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{empName}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{record.date}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AttendanceStatusBadge status={record.status} />
          {canManage && onCorrect && (
            <button
              onClick={onCorrect}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-primary-foreground transition-colors cursor-pointer"
            >
              Correct Record
            </button>
          )}
        </div>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock In */}
        <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Clock In Time
          </span>
          <div className="text-xl font-bold font-mono text-foreground">
            {formatTime(record.clockIn)}
          </div>
        </div>

        {/* Clock Out */}
        <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Clock Out Time
          </span>
          <div className="text-xl font-bold font-mono text-foreground">
            {formatTime(record.clockOut)}
          </div>
        </div>

        {/* Total Hours Worked */}
        <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Worked Duration
          </span>
          <div>
            <WorkDuration
              clockInTime={record.clockIn}
              breakStart={record.breakStart}
              breakEnd={record.breakEnd}
              clockOutTime={record.clockOut}
              workedMinutes={record.workedMinutes}
              size="md"
            />
          </div>
        </div>

        {/* Scheduled Shift */}
        <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scheduled Shift
          </span>
          <div className="text-sm font-semibold text-foreground">
            {hasSchedule
              ? `${scheduledStartFormatted} – ${scheduledEndFormatted}`
              : "Standard Shift (09:00 AM – 05:00 PM)"}
          </div>
        </div>
      </div>

      {/* Additional Details (Late, Overtime, Breaks, Notes) */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Shift Indicators & Audit
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Late minutes */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
            <AlertCircle
              className={`h-5 w-5 ${
                record.lateMinutes > 0 ? "text-amber-500" : "text-emerald-500"
              }`}
            />
            <div>
              <div className="text-xs text-muted-foreground">Late Arrival</div>
              <div className="text-sm font-bold text-foreground">
                {record.lateMinutes > 0 ? `${record.lateMinutes} mins late` : "On Time"}
              </div>
            </div>
          </div>

          {/* Overtime */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">Overtime</div>
              <div className="text-sm font-bold text-foreground">
                {record.overtimeMinutes > 0
                  ? `${record.overtimeMinutes} mins`
                  : "None"}
              </div>
            </div>
          </div>

          {/* Breaks */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
            <Coffee className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-xs text-muted-foreground">Break Logs</div>
              <div className="text-sm font-bold text-foreground">
                {record.breakStart ? `${formatTime(record.breakStart)} - ${formatTime(record.breakEnd)}` : "No break logged"}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {record.notes && (
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-1.5 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Notes & Audit Log</span>
            </div>
            <p className="text-sm text-foreground italic">{record.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
