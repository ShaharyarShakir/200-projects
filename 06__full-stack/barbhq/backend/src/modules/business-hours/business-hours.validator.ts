import { z } from 'zod';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  open: z.string().regex(timeRegex, 'Time must be in HH:mm format (e.g. 09:00)').optional(),
  close: z.string().regex(timeRegex, 'Time must be in HH:mm format (e.g. 21:00)').optional(),
});

export const updateBusinessHoursSchema = z.object({
  monday: dayScheduleSchema.optional(),
  tuesday: dayScheduleSchema.optional(),
  wednesday: dayScheduleSchema.optional(),
  thursday: dayScheduleSchema.optional(),
  friday: dayScheduleSchema.optional(),
  saturday: dayScheduleSchema.optional(),
  sunday: dayScheduleSchema.optional(),
});
