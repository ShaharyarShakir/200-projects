import { z } from 'zod';

export const registerUserSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'employee', 'customer']).default('customer'),
  }),
};
export type RegisterUserBody = z.infer<typeof registerUserSchema.body>;
