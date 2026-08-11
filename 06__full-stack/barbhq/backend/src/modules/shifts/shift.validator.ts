import { z } from 'zod';
import { ShiftExceptionType } from '../../models/shift-exception.model';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createShiftSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:mm'),
  endTime: z.string().regex(timeRegex, 'End time must be HH:mm'),
  breakDurationMinutes: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateShiftSchema = z.object({
  dayOfWeek: z.number().min(0).max(6).optional(),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:mm').optional(),
  endTime: z.string().regex(timeRegex, 'End time must be HH:mm').optional(),
  breakDurationMinutes: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createShiftExceptionSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:mm').optional(),
  endTime: z.string().regex(timeRegex, 'End time must be HH:mm').optional(),
  type: z.nativeEnum(ShiftExceptionType),
  reason: z.string().optional(),
});
