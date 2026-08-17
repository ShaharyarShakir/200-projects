import React from "react";
import { Users, UserCheck, CalendarDays, AlertTriangle } from "lucide-react";
import { StatCard } from "../../../components/ui/StatCard";
import type { Employee } from "../../../types";

interface EmployeeStatsProps {
  employees: Employee[];
  isLoading?: boolean;
}

export const EmployeeStats: React.FC<EmployeeStatsProps> = ({
  employees,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-xl border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  const total = employees.length;
  const clockedIn = employees.filter((emp) => emp.isClockedIn && emp.status === "ACTIVE").length;
  const activeCount = employees.filter((emp) => emp.status === "ACTIVE").length;
  const onLeave = employees.filter((emp) => emp.status === "ON_LEAVE").length;
  const inactiveOrSuspended = employees.filter(
    (emp) => emp.status === "INACTIVE" || emp.status === "SUSPENDED"
  ).length;

  // Compute active duty rate
  const dutyRate = activeCount > 0 ? Math.round((clockedIn / activeCount) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
      <StatCard
        title="Total Roster"
        value={total}
        description={`${activeCount} active, ${inactiveOrSuspended} inactive`}
        icon={<Users className="h-5 w-5" />}
      />
      <StatCard
        title="On Duty"
        value={clockedIn}
        description={`${dutyRate}% of active roster online`}
        icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
      />
      <StatCard
        title="On Leave"
        value={onLeave}
        description="Scheduled time off roster"
        icon={<CalendarDays className="h-5 w-5 text-amber-500" />}
      />
      <StatCard
        title="Roster Alerts"
        value={inactiveOrSuspended}
        description="Requires credentials review"
        icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
      />
    </div>
  );
};

export default EmployeeStats;
