import { z } from 'zod';
import { SalaryType, CommissionType } from '../../models/employee-compensation.model';

export const createCompensationSchema = z.object({
  salaryType: z.nativeEnum(SalaryType),
  baseSalary: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  commissionEnabled: z.boolean().optional(),
  commissionType: z.nativeEnum(CommissionType).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  overtimeEnabled: z.boolean().optional(),
  overtimeMultiplier: z.number().min(1).optional(),
  effectiveFrom: z.string().min(1, 'effectiveFrom is required'),
});

export const updateCompensationSchema = z.object({
  salaryType: z.nativeEnum(SalaryType).optional(),
  baseSalary: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  commissionEnabled: z.boolean().optional(),
  commissionType: z.nativeEnum(CommissionType).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  overtimeEnabled: z.boolean().optional(),
  overtimeMultiplier: z.number().min(1).optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});
