import { z } from "zod";

export const attendanceCorrectionSchema = z.object({
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  status: z.enum([
    "NOT_STARTED",
    "WORKING",
    "LATE",
    "COMPLETED",
    "ABSENT",
    "HALF_DAY",
    "ON_LEAVE",
  ]).optional(),
  notes: z.string().min(3, "Please provide a reason for correcting attendance"),
});

export type AttendanceCorrectionFormData = z.infer<typeof attendanceCorrectionSchema>;
