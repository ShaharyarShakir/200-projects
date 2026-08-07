import { AttendanceRepository } from './attendance.repository';
import { EmployeeRepository } from '../employee/employee.repository';
import type { IAttendanceDocument } from './attendance.model';
import { ApiError } from '../../utils/ApiError';
import { AttendanceStatus } from './attendance.types';
import { EmployeeStatus } from '../employee/employee.types';

export class AttendanceService {
  private attendanceRepository: AttendanceRepository;
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.attendanceRepository = new AttendanceRepository();
    this.employeeRepository = new EmployeeRepository();
  }

  async clockIn(shopId: string, employeeId: string, notes?: string): Promise<IAttendanceDocument> {
    const employee = await this.employeeRepository.findById(employeeId, shopId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    if (employee.status !== EmployeeStatus.ACTIVE) {
      throw new ApiError(400, 'Employee is not ACTIVE');
    }

    if (employee.isClockedIn) {
      throw new ApiError(400, 'Employee is already clocked in');
    }

    const openRecord = await this.attendanceRepository.findOpenAttendance(employeeId, shopId);
    if (openRecord) {
      throw new ApiError(400, 'Employee already has an open clock-in session');
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]!;

    const todayRecord = await this.attendanceRepository.findToday(employeeId, shopId, dateStr);
    if (todayRecord) {
      throw new ApiError(400, 'Employee has already logged attendance for today');
    }

    const attendance = await this.attendanceRepository.clockIn({
      shopId,
      employeeId,
      date: dateStr,
      clockIn: now,
      workedMinutes: 0,
      overtimeMinutes: 0,
      status: AttendanceStatus.PRESENT,
      notes,
    });

    employee.isClockedIn = true;
    await employee.save();

    return attendance;
  }

  async clockOut(shopId: string, employeeId: string, notes?: string): Promise<IAttendanceDocument> {
    const employee = await this.employeeRepository.findById(employeeId, shopId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const openRecord = await this.attendanceRepository.findOpenAttendance(employeeId, shopId);
    if (!openRecord) {
      throw new ApiError(400, 'Employee is not clocked in');
    }

    const now = new Date();
    openRecord.clockOut = now;

    const diffMs = now.getTime() - openRecord.clockIn.getTime();
    const workedMinutes = Math.floor(diffMs / 1000 / 60);
    openRecord.workedMinutes = workedMinutes >= 0 ? workedMinutes : 0;

    // Overtime over 8 hours (480 minutes)
    if (openRecord.workedMinutes > 480) {
      openRecord.overtimeMinutes = openRecord.workedMinutes - 480;
    } else {
      openRecord.overtimeMinutes = 0;
    }

    if (notes) {
      openRecord.notes = openRecord.notes ? `${openRecord.notes} | ${notes}` : notes;
    }

    await openRecord.save();

    employee.isClockedIn = false;
    await employee.save();

    return openRecord;
  }

  async getHistory(
    shopId: string,
    filters: { employeeId?: string; startDate?: string; endDate?: string },
  ): Promise<IAttendanceDocument[]> {
    return await this.attendanceRepository.findHistory(shopId, filters);
  }

  async getEmployeeHistory(
    shopId: string,
    employeeId: string,
    filters: { startDate?: string; endDate?: string },
  ): Promise<IAttendanceDocument[]> {
    return await this.attendanceRepository.findHistory(shopId, {
      employeeId,
      ...filters,
    });
  }
}
