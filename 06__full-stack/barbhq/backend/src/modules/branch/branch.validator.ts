import { z } from 'zod';

export const branchAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid branch email address').optional(),
  address: branchAddressSchema.optional(),
  timezone: z.string().optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid branch email address').optional(),
  address: branchAddressSchema.optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});
