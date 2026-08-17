import React, { useMemo } from "react";
import { CalendarDays, Clock, Hourglass, ShieldAlert, BadgeCheck } from "lucide-react";
import { StatCard } from "../../../components/ui/StatCard";
import type { Attendance } from "../../../types";

interface AttendanceCardProps {
  attendanceRecords: Attendance[];
  isClockedIn?: boolean;
  isLoading?: boolean;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  attendanceRecords,
  isClockedIn = false,
  isLoading = false,
}) => {
  const stats = useMemo(() => {
    const daysWorked = attendanceRecords.filter(
      (rec) => rec.status === "PRESENT" || rec.status === "LATE" || rec.status === "HALF_DAY"
    ).length;

    const totalMinutes = attendanceRecords.reduce((sum, rec) => sum + (rec.workedMinutes ?? 0), 0);
    const hoursWorked = parseFloat((totalMinutes / 60).toFixed(1));

    const lateDays = attendanceRecords.filter((rec) => rec.status === "LATE").length;

    const totalOvertimeMinutes = attendanceRecords.reduce(
      (sum, rec) => sum + (rec.overtimeMinutes ?? 0),
      0
    );
    const overtimeHours = parseFloat((totalOvertimeMinutes / 60).toFixed(1));

    return { daysWorked, hoursWorked, lateDays, overtimeHours };
  }, [attendanceRecords]);

  if (isLoading) {
    return (
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-5 animate-pulse select-none">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="bg-secondary/30 border border-border rounded-xl h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="gap-4 grid grid-cols-2 lg:grid-cols-5 select-none">
      <StatCard
        title="Days Worked"
        value={stats.daysWorked}
        description="Shift days active"
        icon={<CalendarDays className="w-5 h-5 text-primary" />}
      />
      <StatCard
        title="Hours Logged"
        value={`${stats.hoursWorked} hrs`}
        description="Total duration recorded"
        icon={<Clock className="w-5 h-5 text-primary" />}
      />
      <StatCard
        title="Late Days"
        value={stats.lateDays}
        description="Tardy clock-ins"
        icon={<ShieldAlert className={`h-5 w-5 ${stats.lateDays > 0 ? "text-destructive" : "text-muted-foreground/55"}`} />}
      />
      <StatCard
        title="Overtime"
        value={`${stats.overtimeHours} hrs`}
        description="Hours above 8h shifts"
        icon={<Hourglass className="w-5 h-5 text-emerald-500" />}
      />
      <StatCard
        title="Current Status"
        value={isClockedIn ? "ON DUTY" : "OFF DUTY"}
        description={isClockedIn ? "Active session open" : "No active session"}
        icon={
          isClockedIn ? (
            <span className="flex bg-emerald-500 rounded-full w-2 h-2 animate-ping" />
          ) : (
            <BadgeCheck className="w-5 h-5 text-muted-foreground" />
          )
        }
      />
    </div>
  );
};

export default AttendanceCard;
