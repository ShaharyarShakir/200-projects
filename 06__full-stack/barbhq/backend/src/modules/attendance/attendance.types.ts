import { AttendanceStatus } from '../../models/attendance.model';

export { AttendanceStatus };

export interface ClockInDto {
  notes?: string;
}

export interface ClockOutDto {
  notes?: string;
}

export interface UpdateAttendanceDto {
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  workedMinutes?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeMinutes?: number;
  status?: AttendanceStatus;
  notes?: string;
}
