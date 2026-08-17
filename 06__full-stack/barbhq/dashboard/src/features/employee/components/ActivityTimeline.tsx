import React, { useMemo } from "react";
import { format } from "date-fns";
import {
  UserPlus,
  LogIn,
  LogOut,
  ShieldAlert,
  Activity,
  ArrowRightLeft,
  CalendarDays,
} from "lucide-react";
import type { Employee, Attendance } from "../../../types";

interface ActivityTimelineProps {
  employee: Employee;
  attendanceRecords: Attendance[];
  isLoading?: boolean;
}

interface ActivityEvent {
  id: string;
  type: "creation" | "status_change" | "clock_in" | "clock_out" | "hire";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
  colorClass: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  employee,
  attendanceRecords,
  isLoading = false,
}) => {
  const events = useMemo<ActivityEvent[]>(() => {
    const list: ActivityEvent[] = [];

    // 1. Account Hired / Commenced Event
    if (employee.hireDate) {
      const hireDate = new Date(employee.hireDate);
      if (!Number.isNaN(hireDate.getTime())) {
        list.push({
          id: `hire-${employee.id}`,
          type: "hire",
          title: "Employment Commenced",
          description: `Officially rostered as a ${employee.role.toLowerCase()} under a ${employee.employmentType.replace(/_/g, " ").toLowerCase()} agreement.`,
          timestamp: hireDate,
          icon: <CalendarDays className="w-4 h-4" />,
          colorClass: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
        });
      }
    }

    // 2. Profile Created Event
    if (employee.createdAt) {
      list.push({
        id: `create-${employee.id}`,
        type: "creation",
        title: "Staff Roster Record Created",
        description: `Roster profile created with employee code ${employee.employeeCode}.`,
        timestamp: new Date(employee.createdAt),
        icon: <UserPlus className="w-4 h-4" />,
        colorClass: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
      });
    }

    // 3. Status Alerts (if suspended or on leave)
    if (employee.status !== "ACTIVE" && employee.updatedAt) {
      const statusLabels: Record<string, string> = {
        INACTIVE: "deactivated",
        SUSPENDED: "suspended",
        ON_LEAVE: "placed on leave",
      };
      const label = statusLabels[employee.status] || employee.status.toLowerCase();
      list.push({
        id: `status-${employee.id}-${employee.status}`,
        type: "status_change",
        title: `Roster Status Alert`,
        description: `Roster profile has been ${label}.`,
        timestamp: new Date(employee.updatedAt),
        icon: <ShieldAlert className="w-4 h-4" />,
        colorClass: "bg-red-500/10 text-red-500 border border-red-500/20",
      });
    }

    // 4. Clock In & Out Events from attendance records
    attendanceRecords.forEach((rec) => {
      // Clock In event
      list.push({
        id: `clock-in-${rec.id}`,
        type: "clock_in",
        title: "Clocked In",
        description: rec.notes
          ? `Clocked in for duty: "${rec.notes}"`
          : "Clocked in for active shift.",
        timestamp: new Date(rec.clockIn),
        icon: <LogIn className="w-4 h-4" />,
        colorClass: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
      });

      // Clock Out event
      if (rec.clockOut) {
        const workedMinutes = rec.workedMinutes ?? 0;
        const overtimeMinutes = rec.overtimeMinutes ?? 0;
        const hrs = Math.floor(workedMinutes / 60);
        const mins = workedMinutes % 60;
        const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        let desc = `Clocked out after working ${durationStr}.`;
        if (overtimeMinutes > 0) {
          const othrs = Math.floor(overtimeMinutes / 60);
          const otmins = overtimeMinutes % 60;
          desc += ` (Overtime: ${othrs > 0 ? `${othrs}h ${otmins}m` : `${otmins}m`})`;
        }
        if (rec.notes) {
          desc += ` Notes: "${rec.notes}"`;
        }

        list.push({
          id: `clock-out-${rec.id}`,
          type: "clock_out",
          title: "Clocked Out",
          description: desc,
          timestamp: new Date(rec.clockOut),
          icon: <LogOut className="w-4 h-4" />,
          colorClass: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
        });
      }
    });

    // Sort chronologically in reverse (newest first)
    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [employee, attendanceRecords]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse select-none">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="bg-secondary/35 rounded-full w-8 h-8 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="bg-secondary/30 rounded w-1/4 h-4" />
              <div className="bg-secondary/20 rounded w-3/4 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-card shadow-sm p-12 border border-border/80 rounded-xl font-sans text-muted-foreground text-center select-none">
        <div className="flex flex-col justify-center items-center gap-2">
          <Activity className="w-8 h-8 text-muted-foreground/45" />
          <p className="font-semibold text-foreground text-sm">No recent activity</p>
          <p className="text-xs">There are no logged events for this employee roster profile yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-card shadow-sm p-6 md:p-8 border border-border/80 rounded-2xl overflow-hidden font-sans animate-fade-in select-none">
      <div className="flex items-center gap-2 mb-6 pb-3 border-border/60 border-b">
        <ArrowRightLeft className="w-4.5 h-4.5 text-primary" />
        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
          Roster & Attendance Activity Feed
        </h3>
      </div>

      <div className="relative space-y-6 ml-4.5 py-2 pl-6 border-border/80 border-l-2">
        {events.map((event) => (
          <div key={event.id} className="group relative">
            {/* Timeline bullet icon */}
            <div
              className={`absolute -left-8.75 top-0.5 flex h-7 w-7 items-center justify-center rounded-full shrink-0 transition-transform duration-250 group-hover:scale-110 shadow-sm ${event.colorClass}`}
            >
              {event.icon}
            </div>

            {/* Event Body */}
            <div className="space-y-1">
              <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1">
                <span className="font-bold text-foreground text-sm leading-normal">
                  {event.title}
                </span>
                <span className="font-sans font-bold text-[10px] text-muted-foreground/75 uppercase tracking-wide">
                  {format(event.timestamp, "MMM dd, yyyy 'at' hh:mm a")}
                </span>
              </div>
              <p className="mt-0.5 max-w-2xl text-muted-foreground text-xs leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
