import { z } from 'zod';
import { LeaveType } from '../../models/leave.model';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createLeaveRequestSchema = z.object({
  type: z.nativeEnum(LeaveType),
  startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD'),
  reason: z.string().optional(),
});

export const reviewLeaveRequestSchema = z.object({
  reason: z.string().optional(),
});
