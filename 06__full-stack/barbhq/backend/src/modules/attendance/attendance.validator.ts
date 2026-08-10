import { z } from 'zod';
import { AttendanceStatus } from '../../models/attendance.model';

export const clockInSchema = z.object({
  notes: z.string().optional(),
});

export const clockOutSchema = z.object({
  notes: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
  workedMinutes: z.number().min(0).optional(),
  lateMinutes: z.number().min(0).optional(),
  earlyLeaveMinutes: z.number().min(0).optional(),
  overtimeMinutes: z.number().min(0).optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  notes: z.string().optional(),
});
