export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
}

export interface IAttendance {
  shopId: string;
  employeeId: string;
  date: string; // Format: YYYY-MM-DD
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  workedMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
