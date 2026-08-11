import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(150),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(150).optional(),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateVendorDto = z.infer<typeof createVendorSchema>;
export type UpdateVendorDto = z.infer<typeof updateVendorSchema>;
