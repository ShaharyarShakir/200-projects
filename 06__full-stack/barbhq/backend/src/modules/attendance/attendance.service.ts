import { attendanceRepository, AttendanceRepository } from './attendance.repository';
import { shiftRepository } from '../shifts/shift.repository';
import { auditLogService } from '../audit-logs/audit-log.service';
import { User } from '../../models/user.model';
import { AttendanceStatus, type IAttendance } from '../../models/attendance.model';
import type { ClockInDto, ClockOutDto, UpdateAttendanceDto } from './attendance.types';
import { ApiError } from '../../utils/ApiError';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../../models/notification.model';

export class AttendanceService {
  constructor(private repository: AttendanceRepository = attendanceRepository) {}

  private getTodayString(now: Date = new Date()): string {
    return now.toISOString().split('T')[0] || '';
  }

  private parseTimeToDate(dateStr: string, timeStr: string): Date {
    const parts = timeStr.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const date = new Date(dateStr);
    date.setUTCHours(hours, minutes, 0, 0);
    return date;
  }

  async clockIn(shopId: string, employeeId: string, dto: ClockInDto): Promise<IAttendance> {
    const user = await User.findOne({ _id: employeeId, shopId });
    if (!user || !user.isActive) {
      throw new ApiError(403, 'Employee is inactive or not found in this shop');
    }

    const now = new Date();
    const today = this.getTodayString(now);

    const existing = await this.repository.findByEmployeeAndDate(shopId, employeeId, today);
    if (existing && existing.clockIn) {
      throw new ApiError(400, 'Employee is already clocked in today');
    }

    // Lookup today's schedule (Shift Exception or Recurring Shift)
    const dayOfWeek = now.getUTCDay();
    const exception = await shiftRepository.findExceptionByEmployeeAndDate(shopId, employeeId, today);
    const recurringShift = await shiftRepository.findShiftByEmployeeAndDay(shopId, employeeId, dayOfWeek);

    let scheduledStart: Date | undefined;
    let scheduledEnd: Date | undefined;
    let lateMinutes = 0;
    let status = AttendanceStatus.PRESENT;

    if (exception && exception.startTime && exception.endTime) {
      scheduledStart = this.parseTimeToDate(today, exception.startTime);
      scheduledEnd = this.parseTimeToDate(today, exception.endTime);
    } else if (recurringShift && recurringShift.isActive) {
      scheduledStart = this.parseTimeToDate(today, recurringShift.startTime);
      scheduledEnd = this.parseTimeToDate(today, recurringShift.endTime);
    }

    if (scheduledStart) {
      const diffMs = now.getTime() - scheduledStart.getTime();
      if (diffMs > 0) {
        lateMinutes = Math.floor(diffMs / 60000);
        if (lateMinutes > 5) {
          status = AttendanceStatus.LATE;
        }
      }
    }

    let record: IAttendance;
    if (existing) {
      existing.clockIn = now;
      existing.scheduledStart = scheduledStart;
      existing.scheduledEnd = scheduledEnd;
      existing.lateMinutes = lateMinutes;
      existing.status = status;
      if (dto.notes) existing.notes = dto.notes;
      record = await existing.save();
    } else {
      record = await this.repository.create({
        shopId: shopId as any,
        employeeId: employeeId as any,
        date: today,
        scheduledStart,
        scheduledEnd,
        clockIn: now,
        lateMinutes,
        status,
        notes: dto.notes || '',
      });
    }

    if (status === AttendanceStatus.LATE) {
      const managers = await User.find({ shopId, role: { $in: ['OWNER', 'MANAGER'] }, isActive: true });
      if (managers.length > 0) {
        notificationService.publish({
          shopId,
          type: NotificationType.EMPLOYEE_LATE,
          recipientIds: managers.map((m) => m._id.toString()),
          data: {
            employeeName: `${user.firstName} ${user.lastName}`,
            checkInTime: now.toISOString(),
          },
        }).catch((err) => console.error('[Notification Trigger Error]', err));
      }
    }

    return record;
  }


  async startBreak(shopId: string, employeeId: string): Promise<IAttendance> {
    const today = this.getTodayString();
    const attendance = await this.repository.findByEmployeeAndDate(shopId, employeeId, today);

    if (!attendance || !attendance.clockIn || attendance.clockOut) {
      throw new ApiError(400, 'Employee must be clocked in and working to start a break');
    }

    if (attendance.breakStart && !attendance.breakEnd) {
      throw new ApiError(400, 'Employee is already on a break');
    }

    attendance.breakStart = new Date();
    return attendance.save();
  }

  async endBreak(shopId: string, employeeId: string): Promise<IAttendance> {
    const today = this.getTodayString();
    const attendance = await this.repository.findByEmployeeAndDate(shopId, employeeId, today);

    if (!attendance || !attendance.breakStart || attendance.breakEnd) {
      throw new ApiError(400, 'Employee is not currently on a break');
    }

    attendance.breakEnd = new Date();
    return attendance.save();
  }

  async clockOut(shopId: string, employeeId: string, dto: ClockOutDto): Promise<IAttendance> {
    const now = new Date();
    const today = this.getTodayString(now);

    const attendance = await this.repository.findByEmployeeAndDate(shopId, employeeId, today);
    if (!attendance || !attendance.clockIn) {
      throw new ApiError(400, 'Employee cannot clock out without clocking in first');
    }

    if (attendance.clockOut) {
      throw new ApiError(400, 'Employee has already clocked out today');
    }

    if (attendance.breakStart && !attendance.breakEnd) {
      throw new ApiError(400, 'Employee must end current break before clocking out');
    }

    attendance.clockOut = now;

    // Calculate worked minutes
    const totalMs = now.getTime() - attendance.clockIn.getTime();
    let breakMs = 0;
    if (attendance.breakStart && attendance.breakEnd) {
      breakMs = attendance.breakEnd.getTime() - attendance.breakStart.getTime();
    }

    const workedMinutes = Math.max(0, Math.floor((totalMs - breakMs) / 60000));
    attendance.workedMinutes = workedMinutes;

    // Calculate overtime & early leave against scheduledEnd
    if (attendance.scheduledEnd) {
      const diffMs = now.getTime() - attendance.scheduledEnd.getTime();
      if (diffMs > 0) {
        attendance.overtimeMinutes = Math.floor(diffMs / 60000);
        attendance.earlyLeaveMinutes = 0;
      } else if (diffMs < 0) {
        attendance.earlyLeaveMinutes = Math.floor(Math.abs(diffMs) / 60000);
        attendance.overtimeMinutes = 0;
      }
    }

    // Determine status (HALF_DAY if worked less than half scheduled shift or < 240 mins)
    if (attendance.scheduledStart && attendance.scheduledEnd) {
      const scheduledMinutes = Math.floor((attendance.scheduledEnd.getTime() - attendance.scheduledStart.getTime()) / 60000);
      if (workedMinutes < scheduledMinutes / 2) {
        attendance.status = AttendanceStatus.HALF_DAY;
      }
    }

    if (dto.notes) {
      attendance.notes = attendance.notes ? `${attendance.notes}; ${dto.notes}` : dto.notes;
    }

    return attendance.save();
  }

  async getAttendance(shopId: string, date?: string, employeeId?: string): Promise<IAttendance[]> {
    return this.repository.findByShop(shopId, date, employeeId);
  }

  async updateAttendance(id: string, shopId: string, actorId: string, dto: UpdateAttendanceDto): Promise<IAttendance> {
    const existing = await this.repository.findByIdAndShop(id, shopId);
    if (!existing) {
      throw new ApiError(404, 'Attendance record not found');
    }

    const updated = await this.repository.update(id, shopId, dto);

    await auditLogService.logAction({
      shopId,
      actorId,
      action: 'ATTENDANCE_MODIFIED',
      entity: 'Attendance',
      entityId: id,
      oldValue: existing.toJSON(),
      newValue: updated!.toJSON(),
    });

    return updated!;
  }
}

export const attendanceService = new AttendanceService();
