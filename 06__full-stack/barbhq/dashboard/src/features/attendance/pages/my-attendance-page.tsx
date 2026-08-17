import React from "react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { ClockCard } from "../components/clock-card";
import { AttendanceStatusBadge } from "../components/attendance-status-badge";
import { WorkDuration } from "../components/work-duration";
import {
  useMyAttendanceQuery,
} from "../attendance.queries";
import {
  useClockInMutation,
  useClockOutMutation,
  useStartBreakMutation,
  useEndBreakMutation,
} from "../attendance.mutations";
import { useAuthStore } from "../../../store/authStore";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export const MyAttendancePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const userName = user ? user.firstName : "Employee";

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: myRecords = [], isLoading } = useMyAttendanceQuery();

  const todayRecord = myRecords.find((r) => r.date === todayStr) || null;

  const clockInMutation = useClockInMutation();
  const clockOutMutation = useClockOutMutation();
  const startBreakMutation = useStartBreakMutation();
  const endBreakMutation = useEndBreakMutation();

  const isMutating =
    clockInMutation.isPending ||
    clockOutMutation.isPending ||
    startBreakMutation.isPending ||
    endBreakMutation.isPending;

  // Personal statistics
  const totalPresent = myRecords.filter(
    (r) => r.status === "COMPLETED" || r.status === "WORKING" || r.clockIn,
  ).length;

  const totalLate = myRecords.filter(
    (r) => r.status === "LATE" || r.lateMinutes > 5,
  ).length;

  const totalWorkedMins = myRecords.reduce(
    (acc, r) => acc + (r.workedMinutes || 0),
    0,
  );
  const totalHours = Math.floor(totalWorkedMins / 60);
  const remainingMins = totalWorkedMins % 60;

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <PageContainer className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Attendance & Time Log"
        description="Clock in, clock out, manage breaks, and track your working hours"
      />

      {/* Main Clocking Card */}
      <ClockCard
        userName={userName}
        todayRecord={todayRecord}
        onClockIn={async (notes) => {
          await clockInMutation.mutateAsync({ notes });
        }}
        onClockOut={async (notes) => {
          await clockOutMutation.mutateAsync({ notes });
        }}
        onStartBreak={async () => {
          await startBreakMutation.mutateAsync();
        }}
        onEndBreak={async () => {
          await endBreakMutation.mutateAsync();
        }}
        isLoading={isMutating}
      />

      {/* Personal Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Days Present
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {totalPresent} <span className="text-xs font-normal text-muted-foreground">days</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Late Arrivals
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {totalLate} <span className="text-xs font-normal text-muted-foreground">times</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Hours Worked
            </span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {totalHours}h {remainingMins}m
          </div>
        </div>
      </div>

      {/* Personal Attendance History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">My Attendance History</h3>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading your attendance history...
          </div>
        ) : myRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground text-sm">
            No personal attendance records found yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">
                      {rec.date}
                    </td>
                    <td className="px-5 py-4">
                      <AttendanceStatusBadge status={rec.status} />
                    </td>
                    <td className="px-5 py-4 text-xs font-mono font-medium">
                      {formatTime(rec.clockIn)}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono font-medium">
                      {formatTime(rec.clockOut)}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono">
                      <WorkDuration
                        clockInTime={rec.clockIn}
                        breakStart={rec.breakStart}
                        breakEnd={rec.breakEnd}
                        clockOutTime={rec.clockOut}
                        workedMinutes={rec.workedMinutes}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default MyAttendancePage;
