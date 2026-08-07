import { z } from 'zod';

export const clockInSchema = {
  body: z.object({
    employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID format'),
    notes: z.string().optional(),
  }),
};

export const clockOutSchema = {
  body: z.object({
    employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID format'),
    notes: z.string().optional(),
  }),
};

export const getHistorySchema = {
  query: z.object({
    employeeId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID format')
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional(),
  }),
};
export type ClockInBody = z.infer<typeof clockInSchema.body>;
export type ClockOutBody = z.infer<typeof clockOutSchema.body>;
