import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar } from "lucide-react";
import { useEmployeeDetails } from "./dashboard.employees.$employeeId";
import { NativeSelect, NativeSelectOption } from "../components/ui/native-select";
import { Input } from "../components/ui/input";
import {
  getAttendance,
  AttendanceCard,
  AttendanceTimeline,
} from "../features/employee";
import type { Attendance } from "../types";

export const Route = createFileRoute(
  "/dashboard/employees/$employeeId/attendance"
)({
  component: EmployeeAttendanceTab,
});

function EmployeeAttendanceTab() {
  const { employeeId } = Route.useParams();
  const { employee } = useEmployeeDetails();

  // 1. Filtering States
  const [filterType, setFilterType] = useState<"ALL" | "MONTH" | "RANGE">("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("THIS_MONTH");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // 2. Compute date queries
  const dateParams = useMemo(() => {
    let startDate = "";
    let endDate = "";

    if (filterType === "MONTH") {
      const today = new Date();
      if (selectedMonth === "THIS_MONTH") {
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
        endDate = format(endOfMonth(today), "yyyy-MM-dd");
      } else if (selectedMonth === "LAST_MONTH") {
        const last = subMonths(today, 1);
        startDate = format(startOfMonth(last), "yyyy-MM-dd");
        endDate = format(endOfMonth(last), "yyyy-MM-dd");
      } else if (selectedMonth === "TWO_MONTHS_AGO") {
        const prev = subMonths(today, 2);
        startDate = format(startOfMonth(prev), "yyyy-MM-dd");
        endDate = format(endOfMonth(prev), "yyyy-MM-dd");
      }
    } else if (filterType === "RANGE") {
      if (dateRange.start) {
        startDate = dateRange.start;
      }
      if (dateRange.end) {
        endDate = dateRange.end;
      }
    }

    return { startDate, endDate };
  }, [filterType, selectedMonth, dateRange]);

  // 3. Fetch Attendance History
  const { data: attendanceRecords = [], isLoading } = useQuery<Attendance[]>({
    queryKey: ["attendance", employeeId, dateParams],
    queryFn: () =>
      getAttendance({
        employeeId,
        startDate: dateParams.startDate || undefined,
        endDate: dateParams.endDate || undefined,
      }),
  });

  return (
    <div className="space-y-6 mt-4 font-sans animate-fade-in select-none">
      {/* Filters top section */}
      <div className="flex md:flex-row flex-col justify-between md:items-center gap-4 bg-card shadow-sm p-4 md:p-6 border border-border/80 rounded-2xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-primary" />
          <h3 className="font-serif font-bold text-foreground text-sm">
            Attendance Log Filters
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Type Selection */}
          <NativeSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="h-8.5 text-xs"
          >
            <NativeSelectOption value="ALL">All Records</NativeSelectOption>
            <NativeSelectOption value="MONTH">Filter by Month</NativeSelectOption>
            <NativeSelectOption value="RANGE">Filter by Custom Range</NativeSelectOption>
          </NativeSelect>

          {/* Month Dropdown */}
          {filterType === "MONTH" && (
            <NativeSelect
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8.5 text-xs animate-slide-up"
            >
              <NativeSelectOption value="THIS_MONTH">This Month</NativeSelectOption>
              <NativeSelectOption value="LAST_MONTH">Last Month</NativeSelectOption>
              <NativeSelectOption value="TWO_MONTHS_AGO">Two Months Ago</NativeSelectOption>
            </NativeSelect>
          )}

          {/* Date range inputs */}
          {filterType === "RANGE" && (
            <div className="flex items-center gap-2 font-semibold text-xs animate-slide-up">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="px-2.5 py-1 h-8.5 text-xs"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="px-2.5 py-1 h-8.5 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Metrics widgets */}
      <AttendanceCard
        attendanceRecords={attendanceRecords}
        isClockedIn={employee.isClockedIn}
        isLoading={isLoading}
      />

      {/* History log timeline */}
      <AttendanceTimeline
        attendanceRecords={attendanceRecords}
        isLoading={isLoading}
      />
    </div>
  );
}

export default EmployeeAttendanceTab;
