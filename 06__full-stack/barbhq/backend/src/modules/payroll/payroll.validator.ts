import { z } from 'zod';
import { PayrollPeriodStatus } from '../../models/payroll-period.model';
import { AdjustmentType } from '../../models/payroll-adjustment.model';

export const createPayrollPeriodSchema = z.object({
  startDate: z.string().min(1, 'startDate is required'),
  endDate: z.string().min(1, 'endDate is required'),
  payDate: z.string().optional(),
});

export const createPayrollAdjustmentSchema = z.object({
  type: z.nativeEnum(AdjustmentType),
  amount: z.number().min(0, 'Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
});

export const payrollPeriodQuerySchema = z.object({
  status: z.nativeEnum(PayrollPeriodStatus).optional(),
});
