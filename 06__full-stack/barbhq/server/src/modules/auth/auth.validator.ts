import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
    shopSlug: z
      .string()
      .min(3, 'Shop slug must be at least 3 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    shopEmail: z.email('Invalid shop email'),
    ownerFirstName: z.string().min(2, 'Owner first name must be at least 2 characters'),
    ownerLastName: z.string().min(2, 'Owner last name must be at least 2 characters'),
    ownerEmail: z.email('Invalid owner email'),
    ownerPassword: z.string().min(6, 'Owner password must be at least 6 characters'),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
};
export type RegisterBody = z.infer<typeof registerSchema.body>;
export type LoginBody = z.infer<typeof loginSchema.body>;
export type RefreshBody = z.infer<typeof refreshSchema.body>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema.body>;
