import React from "react";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { WorkDuration } from "./work-duration";
import { AttendanceActions } from "./attendance-actions";
import type { AttendanceRecord } from "../attendance.types";
import { User } from "lucide-react";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onCorrectRecord?: (record: AttendanceRecord) => void;
  canManage?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onCorrectRecord,
  canManage = true,
  isLoading = false,
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

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-medium">Loading workforce attendance logs...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center select-none space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <User className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Attendance Records Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No attendance entries match your active filters or date selection for today.
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-card shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Clock In</th>
              <th className="px-5 py-3.5">Clock Out</th>
              <th className="px-5 py-3.5">Hours Worked</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record) => {
              const empName = record.employee
                ? `${record.employee.firstName} ${record.employee.lastName}`
                : "Unknown Employee";

              const empRole = record.employee?.role || "Staff";

              return (
                <tr
                  key={record.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-4 font-semibold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                        {record.employee?.avatar ? (
                          <img
                            src={record.employee.avatar}
                            alt={empName}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          `${record.employee?.firstName?.[0] || "E"}${
                            record.employee?.lastName?.[0] || ""
                          }`
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{empName}</div>
                        <div className="text-xs text-muted-foreground font-normal capitalize">
                          {empRole.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-muted-foreground">
                    {record.date}
                  </td>
                  <td className="px-5 py-4">
                    <AttendanceStatusBadge status={record.status} />
                  </td>
                  <td className="px-5 py-4 text-xs font-mono font-medium text-foreground">
                    {formatTime(record.clockIn)}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono font-medium text-foreground">
                    {formatTime(record.clockOut)}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono">
                    <WorkDuration
                      clockInTime={record.clockIn}
                      breakStart={record.breakStart}
                      breakEnd={record.breakEnd}
                      clockOutTime={record.clockOut}
                      workedMinutes={record.workedMinutes}
                    />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <AttendanceActions
                      record={record}
                      onCorrect={onCorrectRecord}
                      canManage={canManage}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
