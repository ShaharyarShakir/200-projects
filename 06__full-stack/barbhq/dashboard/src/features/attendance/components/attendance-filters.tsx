import React from "react";
import { Search, Calendar, X } from "lucide-react";
import type { Employee } from "../../employees/employees.types";

interface AttendanceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedEmployeeId: string;
  onEmployeeChange: (employeeId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  fromDate: string;
  onFromDateChange: (date: string) => void;
  toDate: string;
  onToDateChange: (date: string) => void;
  employees?: Employee[];
  onResetFilters?: () => void;
  className?: string;
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedEmployeeId,
  onEmployeeChange,
  selectedStatus,
  onStatusChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  employees = [],
  onResetFilters,
  className = "",
}) => {
  const hasActiveFilters =
    !!searchQuery ||
    !!selectedEmployeeId ||
    !!selectedStatus ||
    !!fromDate ||
    !!toDate;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Search Input */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search employees..."
          className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Employee Selector */}
      {employees.length > 0 && (
        <select
          value={selectedEmployeeId}
          onChange={(e) => onEmployeeChange(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>
      )}

      {/* Status Selector */}
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
      >
        <option value="">All Statuses</option>
        <option value="WORKING">Working 🟢</option>
        <option value="LATE">Late 🟡</option>
        <option value="COMPLETED">Completed 🔵</option>
        <option value="ABSENT">Absent 🔴</option>
        <option value="NOT_STARTED">Not Started ⚪</option>
      </select>

      {/* Date Range Inputs */}
      <div className="flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-1.5 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer"
        />
        <span className="text-xs text-muted-foreground">→</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && onResetFilters && (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/60 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
