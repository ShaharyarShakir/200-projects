import { z } from 'zod';

export const registerSchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
  shopSlug: z.string().min(2).optional(),
  shopEmail: z.string().email('Invalid shop email').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  ownerFirstName: z.string().min(1, 'Owner first name is required'),
  ownerLastName: z.string().min(1, 'Owner last name is required'),
  ownerEmail: z.string().email('Invalid owner email address'),
  ownerPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});
