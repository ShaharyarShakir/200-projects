import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.coerce.date(),
  tag: z.enum(['devops', 'mlops', 'fullstack', 'mobile', 'machine-learning']),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  readTime: z.number().optional(),
  github: z.string().url().optional(),
});

const devops = defineCollection({
  loader: glob({ base: './src/content/blog/devops', pattern: '**/*.{md,mdx}' }),
  schema: blogSchema,
});

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '*.{md,mdx}' }),
  schema: blogSchema,
});

const fullstack = defineCollection({
  loader: glob({ base: './src/content/blog/fullstack', pattern: '**/*.{md,mdx}' }),
  schema: blogSchema,
});

const mlops = defineCollection({
  loader: glob({ base: './src/content/blog/mlops', pattern: '**/*.{md,mdx}' }),
  schema: blogSchema,
});

const mobile = defineCollection({
  loader: glob({ base: './src/content/blog/mobile', pattern: '**/*.{md,mdx}' }),
  schema: blogSchema,
});

const series = defineCollection({
  loader: glob({ base: './src/content/blog/series', pattern: '**/*.{md,mdx}' }),
  schema: blogSchema,
});

export const collections = {
  blog,
  devops,
  fullstack,
  mlops,
  mobile,
  series,
};
