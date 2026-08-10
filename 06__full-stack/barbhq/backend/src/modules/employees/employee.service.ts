import { employeeRepository, EmployeeRepository } from './employee.repository';
import { shiftRepository } from '../shifts/shift.repository';
import { attendanceRepository } from '../attendance/attendance.repository';
import { auditLogService } from '../audit-logs/audit-log.service';
import type { CreateEmployeeDto, UpdateEmployeeDto, EmployeeDashboardDto } from './employee.types';
import type { IUser } from '../../models/user.model';
import { ApiError } from '../../utils/ApiError';

export class EmployeeService {
  constructor(private repository: EmployeeRepository = employeeRepository) {}

  async createEmployee(shopId: string, actorId: string, dto: CreateEmployeeDto): Promise<IUser> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const employee = await this.repository.create(shopId, dto);

    await auditLogService.logAction({
      shopId,
      actorId,
      action: 'EMPLOYEE_CREATED',
      entity: 'User',
      entityId: employee._id.toString(),
      newValue: employee.toJSON(),
    });

    return employee;
  }

  async getEmployeesByShop(shopId: string): Promise<IUser[]> {
    return this.repository.findByShop(shopId);
  }

  async getEmployeeById(id: string, shopId: string): Promise<IUser> {
    const employee = await this.repository.findByIdAndShop(id, shopId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }
    return employee;
  }

  async updateEmployee(id: string, shopId: string, actorId: string, dto: UpdateEmployeeDto): Promise<IUser> {
    const existing = await this.repository.findByIdAndShop(id, shopId);
    if (!existing) {
      throw new ApiError(404, 'Employee not found');
    }

    const updated = await this.repository.update(id, shopId, dto);

    await auditLogService.logAction({
      shopId,
      actorId,
      action: 'EMPLOYEE_UPDATED',
      entity: 'User',
      entityId: id,
      oldValue: existing.toJSON(),
      newValue: updated!.toJSON(),
    });

    return updated!;
  }

  async toggleEmployeeStatus(id: string, shopId: string, actorId: string, isActive: boolean): Promise<IUser> {
    const existing = await this.repository.findByIdAndShop(id, shopId);
    if (!existing) {
      throw new ApiError(404, 'Employee not found');
    }

    const updated = await this.repository.update(id, shopId, { isActive });

    await auditLogService.logAction({
      shopId,
      actorId,
      action: isActive ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
      entity: 'User',
      entityId: id,
      oldValue: { isActive: existing.isActive },
      newValue: { isActive },
    });

    return updated!;
  }

  async getEmployeeDashboard(shopId: string, employeeId: string): Promise<EmployeeDashboardDto> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0] || '';
    const dayOfWeek = now.getUTCDay();

    // 1. Today's Shift & Attendance
    const shift = await shiftRepository.findShiftByEmployeeAndDay(shopId, employeeId, dayOfWeek);
    const exception = await shiftRepository.findExceptionByEmployeeAndDate(shopId, employeeId, todayStr);
    const attendance = await attendanceRepository.findByEmployeeAndDate(shopId, employeeId, todayStr);

    let status: 'NOT_CLOCKED_IN' | 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT' = 'NOT_CLOCKED_IN';
    if (attendance) {
      if (attendance.clockOut) {
        status = 'CLOCKED_OUT';
      } else if (attendance.breakStart && !attendance.breakEnd) {
        status = 'ON_BREAK';
      } else if (attendance.clockIn) {
        status = 'WORKING';
      }
    }

    // 2. Monthly Metrics
    const allAttendance = await attendanceRepository.findByShop(shopId, undefined, employeeId);
    const currentMonthPrefix = todayStr.substring(0, 7);
    const monthRecords = allAttendance.filter((r) => r.date.startsWith(currentMonthPrefix));

    const workedMinutes = monthRecords.reduce((acc, cur) => acc + (cur.workedMinutes || 0), 0);
    const lateMinutes = monthRecords.reduce((acc, cur) => acc + (cur.lateMinutes || 0), 0);
    const overtimeMinutes = monthRecords.reduce((acc, cur) => acc + (cur.overtimeMinutes || 0), 0);

    // 3. Upcoming Shifts
    const allShifts = await shiftRepository.findShiftsByShop(shopId, employeeId);

    return {
      today: {
        shift: exception || shift || null,
        attendance: attendance || null,
        status,
      },
      thisMonth: {
        workedMinutes,
        lateMinutes,
        overtimeMinutes,
      },
      upcomingShifts: allShifts,
    };
  }
}

export const employeeService = new EmployeeService();
