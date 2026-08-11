import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
