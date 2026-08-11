import { ShiftExceptionType } from '../../models/shift-exception.model';

export { ShiftExceptionType };

export interface CreateShiftDto {
  employeeId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakDurationMinutes?: number;
  isActive?: boolean;
}

export interface UpdateShiftDto {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  breakDurationMinutes?: number;
  isActive?: boolean;
}

export interface CreateShiftExceptionDto {
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  type: ShiftExceptionType;
  reason?: string;
}
