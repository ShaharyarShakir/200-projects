import { UserRole } from '../../models/user.model';

export { UserRole };

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface EmployeeDashboardDto {
  today: {
    shift: any | null;
    attendance: any | null;
    status: 'NOT_CLOCKED_IN' | 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT';
  };
  thisMonth: {
    workedMinutes: number;
    lateMinutes: number;
    overtimeMinutes: number;
  };
  upcomingShifts: any[];
}
