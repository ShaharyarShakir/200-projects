import { z } from 'zod';

export const summarizeSchema = z.object({
  content: z.string().min(10),
  noteId: z.string().uuid().optional(),
});

export const explainSchema = z.object({
  content: z.string().min(3),
});

export const rewriteSchema = z.object({
  content: z.string().min(3),
  style: z.enum(['professional', 'friendly', 'shorter', 'longer', 'grammar']),
});