import type { EmployeeStatus, EmploymentType } from "../../../types";

export interface EmployeeFiltersState {
  search: string;
  status: EmployeeStatus | "ALL";
  role: string; // 'ALL' | 'MANAGER' | 'BARBER' | 'RECEPTIONIST'
  employmentType: EmploymentType | "ALL";
}

export interface AttendanceSummary {
  daysWorked: number;
  hoursWorked: number;
  lateDays: number;
  overtimeHours: number;
  currentStatus: string;
}

export interface EmployeeStatsOverview {
  totalCount: number;
  activeCount: number;
  clockedInCount: number;
  onDutyCount: number;
}
