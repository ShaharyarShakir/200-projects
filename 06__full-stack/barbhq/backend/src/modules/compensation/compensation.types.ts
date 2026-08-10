import { SalaryType, CommissionType } from '../../models/employee-compensation.model';

export interface CreateCompensationDto {
  salaryType: SalaryType;
  baseSalary?: number;
  hourlyRate?: number;
  commissionEnabled?: boolean;
  commissionType?: CommissionType;
  commissionRate?: number;
  overtimeEnabled?: boolean;
  overtimeMultiplier?: number;
  effectiveFrom: string; // YYYY-MM-DD or ISO string
}

export interface UpdateCompensationDto {
  salaryType?: SalaryType;
  baseSalary?: number;
  hourlyRate?: number;
  commissionEnabled?: boolean;
  commissionType?: CommissionType;
  commissionRate?: number;
  overtimeEnabled?: boolean;
  overtimeMultiplier?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}
