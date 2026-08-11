import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createHolidaySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  name: z.string().min(1, 'Holiday name is required'),
});

export const updateHolidaySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
  name: z.string().min(1, 'Holiday name must not be empty').optional(),
});
