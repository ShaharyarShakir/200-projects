import { shiftRepository, ShiftRepository } from './shift.repository';
import { auditLogService } from '../audit-logs/audit-log.service';
import type { CreateShiftDto, UpdateShiftDto, CreateShiftExceptionDto } from './shift.types';
import type { IEmployeeShift } from '../../models/employee-shift.model';
import type { IShiftException } from '../../models/shift-exception.model';
import { ApiError } from '../../utils/ApiError';

export class ShiftService {
  constructor(private repository: ShiftRepository = shiftRepository) {}

  private validateTime(startTime?: string, endTime?: string): void {
    if (startTime && endTime && startTime >= endTime) {
      throw new ApiError(400, `Shift start time (${startTime}) must be before end time (${endTime})`);
    }
  }

  async createShift(shopId: string, actorId: string, dto: CreateShiftDto): Promise<IEmployeeShift> {
    this.validateTime(dto.startTime, dto.endTime);

    const existing = await this.repository.findShiftByEmployeeAndDay(shopId, dto.employeeId, dto.dayOfWeek);
    if (existing) {
      throw new ApiError(400, `Shift already exists for this employee on day ${dto.dayOfWeek}`);
    }

    const shift = await this.repository.createShift(shopId, dto);

    await auditLogService.logAction({
      shopId,
      actorId,
      action: 'SHIFT_CREATED',
      entity: 'EmployeeShift',
      entityId: shift._id.toString(),
      newValue: shift.toJSON(),
    });

    return shift;
  }

  async getShifts(shopId: string, employeeId?: string): Promise<IEmployeeShift[]> {
    return this.repository.findShiftsByShop(shopId, employeeId);
  }

  async getShiftById(id: string, shopId: string): Promise<IEmployeeShift> {
    const shift = await this.repository.findShiftByIdAndShop(id, shopId);
    if (!shift) {
      throw new ApiError(404, 'Shift not found');
    }
    return shift;
  }

  async updateShift(id: string, shopId: string, actorId: string, dto: UpdateShiftDto): Promise<IEmployeeShift> {
    const existing = await this.repository.findShiftByIdAndShop(id, shopId);
    if (!existing) {
      throw new ApiError(404, 'Shift not found');
    }

    const startTime = dto.startTime || existing.startTime;
    const endTime = dto.endTime || existing.endTime;
    this.validateTime(startTime, endTime);

    const updated = await this.repository.updateShift(id, shopId, dto);

    await auditLogService.logAction({
      shopId,
      actorId,
      action: 'SHIFT_UPDATED',
      entity: 'EmployeeShift',
      entityId: id,
      oldValue: existing.toJSON(),
      newValue: updated!.toJSON(),
    });

    return updated!;
  }

  async deleteShift(id: string, shopId: string, actorId: string): Promise<void> {
    const deleted = await this.repository.deleteShift(id, shopId);
    if (!deleted) {
      throw new ApiError(404, 'Shift not found');
    }

    await auditLogService.logAction({
      shopId,
      actorId,
      action: 'SHIFT_DELETED',
      entity: 'EmployeeShift',
      entityId: id,
      oldValue: deleted.toJSON(),
    });
  }

  // Shift Exceptions
  async createException(shopId: string, actorId: string, dto: CreateShiftExceptionDto): Promise<IShiftException> {
    if (dto.startTime && dto.endTime) {
      this.validateTime(dto.startTime, dto.endTime);
    }

    const existing = await this.repository.findExceptionByEmployeeAndDate(shopId, dto.employeeId, dto.date);
    if (existing) {
      throw new ApiError(400, `Shift exception already exists for employee on date ${dto.date}`);
    }

    const exception = await this.repository.createException(shopId, actorId, dto);

    await auditLogService.logAction({
      shopId,
      actorId,
      action: 'SHIFT_EXCEPTION_CREATED',
      entity: 'ShiftException',
      entityId: exception._id.toString(),
      newValue: exception.toJSON(),
    });

    return exception;
  }

  async getExceptions(shopId: string, employeeId?: string, date?: string): Promise<IShiftException[]> {
    return this.repository.findExceptionsByShop(shopId, employeeId, date);
  }
}

export const shiftService = new ShiftService();
