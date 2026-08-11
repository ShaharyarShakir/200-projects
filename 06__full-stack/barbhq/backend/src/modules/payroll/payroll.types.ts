import { PayrollPeriodStatus } from '../../models/payroll-period.model';
import { AdjustmentType } from '../../models/payroll-adjustment.model';

export interface CreatePayrollPeriodDto {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payDate?: string;
}

export interface CreatePayrollAdjustmentDto {
  type: AdjustmentType;
  amount: number;
  reason: string;
}

export interface PayrollPeriodQueryDto {
  status?: PayrollPeriodStatus;
}
