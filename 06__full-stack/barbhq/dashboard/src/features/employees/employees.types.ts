export type EmployeeRole = "OWNER" | "MANAGER" | "RECEPTIONIST" | "BARBER";

export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT";

export type SalaryType = "MONTHLY" | "HOURLY" | "COMMISSION_ONLY";

export interface Employee {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: EmployeeRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  status: EmployeeStatus;
  employeeCode?: string;
  employmentType?: EmploymentType;
  salaryType?: SalaryType;
  salary?: number;
  hourlyRate?: number;
  commissionEnabled?: boolean;
  commissionRate?: number;
  isClockedIn?: boolean;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFilterParams {
  search?: string;
  role?: string;
  status?: string;
  employmentType?: string;
  page?: number;
  limit?: number;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: EmployeeRole;
  phone?: string;
  avatar?: string;
  employmentType?: EmploymentType;
  salaryType?: SalaryType;
  salary?: number;
  commissionRate?: number;
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: EmployeeRole;
  isActive?: boolean;
  employmentType?: EmploymentType;
  salaryType?: SalaryType;
  salary?: number;
  commissionRate?: number;
}

export interface EmployeeStatsOverview {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  barbersCount: number;
}
