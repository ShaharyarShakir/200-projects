import { z } from 'zod';

export const createEmployeeSchema = {
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    role: z.enum(['OWNER', 'MANAGER', 'RECEPTIONIST', 'BARBER']),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']).default('FULL_TIME'),
    salaryType: z.enum(['MONTHLY', 'HOURLY', 'COMMISSION_ONLY']).default('MONTHLY'),
    salary: z.number().min(0, 'Salary must be at least 0').optional().default(0),
    commissionEnabled: z.boolean().optional().default(false),
    commissionRate: z.number().min(0, 'Commission rate must be at least 0').optional().default(0),
    avatar: z.string().optional(),
  }),
};

export const updateEmployeeSchema = {
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    role: z.enum(['OWNER', 'MANAGER', 'RECEPTIONIST', 'BARBER']).optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']).optional(),
    salaryType: z.enum(['MONTHLY', 'HOURLY', 'COMMISSION_ONLY']).optional(),
    salary: z.number().min(0, 'Salary must be at least 0').optional(),
    commissionEnabled: z.boolean().optional(),
    commissionRate: z.number().min(0, 'Commission rate must be at least 0').optional(),
    avatar: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE']).optional(),
  }),
};

export const employeeIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID format'),
  }),
};
