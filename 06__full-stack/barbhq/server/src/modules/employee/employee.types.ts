import type { UserRole } from '../user/user.types';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ON_LEAVE = 'ON_LEAVE',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
}

export enum SalaryType {
  MONTHLY = 'MONTHLY',
  HOURLY = 'HOURLY',
  COMMISSION_ONLY = 'COMMISSION_ONLY',
}

export interface IEmployee {
  shopId: string;
  userId?: string; // Reference to login account if invited
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  employmentType: EmploymentType;
  hireDate: Date;
  salaryType: SalaryType;
  salary: number;
  commissionEnabled: boolean;
  commissionRate: number; // percentage e.g. 10 for 10%
  status: EmployeeStatus;
  isClockedIn: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}
