export type AttendanceStatusType =
  | "NOT_STARTED"
  | "WORKING"
  | "LATE"
  | "COMPLETED"
  | "ABSENT"
  | "HALF_DAY"
  | "ON_LEAVE";

export interface AttendanceEmployeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  shopId: string;
  employeeId: string;
  employee?: AttendanceEmployeeInfo;
  date: string; // YYYY-MM-DD
  scheduledStart?: string;
  scheduledEnd?: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatusType;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceSummary {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  completedCount: number;
  workingCount: number;
  totalHoursWorked: number;
}

export interface AttendanceFilterParams {
  date?: string;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  status?: string;
  search?: string;
}

export interface ClockInPayload {
  notes?: string;
}

export interface ClockOutPayload {
  notes?: string;
}

export interface UpdateAttendancePayload {
  clockIn?: string;
  clockOut?: string;
  status?: AttendanceStatusType;
  lateMinutes?: number;
  workedMinutes?: number;
  notes?: string;
}
