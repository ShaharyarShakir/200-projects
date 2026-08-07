import { z } from 'zod';

export const shopSlugSchema = {
  params: z.object({
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  }),
};
