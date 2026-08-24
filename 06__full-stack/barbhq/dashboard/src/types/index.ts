export const UserRole = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  RECEPTIONIST: "RECEPTIONIST",
  BARBER: "BARBER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ON_LEAVE";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT";
export type SalaryType = "MONTHLY" | "HOURLY" | "COMMISSION_ONLY";

export interface Employee extends User {
  employeeCode: string;
  employmentType: EmploymentType;
  hireDate: string;
  salaryType: SalaryType;
  salary: number;
  commissionEnabled: boolean;
  commissionRate: number;
  status: EmployeeStatus;
  isClockedIn: boolean;
  specialties?: string[];
  schedule?: {
    day: string;
    start: string;
    end: string;
    isOff: boolean;
  }[];
  createdBy?: string;
  updatedBy?: string;
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";

export interface Attendance {
  id: string;
  shopId: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO date string
  clockOut?: string; // ISO date string
  workedMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  timezone: string;
  currency: string;
  businessHours: {
    day: string;
    open: string;
    close: string;
    isOpen: boolean;
  }[];
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  avatar?: string;
  notes?: string;
  createdAt: string;
  lastVisit?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  barberId: string;
  barberName: string;
  serviceIds: string[];
  serviceNames: string[];
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  totalPrice: number;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  color?: string;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  lowStockThreshold: number;
  price: number;
  cost: number;
  supplier?: string;
}

export interface DashboardStats {
  revenueToday: number;
  revenueWeekly: number;
  appointmentsToday: number;
  occupancyRate: number;
  revenueChartData: { name: string; amount: number }[];
  appointmentStatusData: { name: string; value: number }[];
}
