import { compensationRepository, CompensationRepository } from './compensation.repository';
import type { CreateCompensationDto, UpdateCompensationDto } from './compensation.types';
import type { IEmployeeCompensation } from '../../models/employee-compensation.model';
import { User } from '../../models/user.model';
import { auditLogService, AuditLogService } from '../audit-logs/audit-log.service';
import { ApiError } from '../../utils/ApiError';

export class CompensationService {
  constructor(
    private repository: CompensationRepository = compensationRepository,
    private auditLog: AuditLogService = auditLogService,
  ) {}

  async getActiveCompensation(shopId: string, employeeId: string): Promise<IEmployeeCompensation | null> {
    const employee = await User.findOne({ _id: employeeId, shopId });
    if (!employee) {
      throw new ApiError(404, 'Employee not found in this shop');
    }
    return this.repository.findActiveByEmployee(shopId, employeeId);
  }

  async getCompensationHistory(shopId: string, employeeId: string): Promise<IEmployeeCompensation[]> {
    const employee = await User.findOne({ _id: employeeId, shopId });
    if (!employee) {
      throw new ApiError(404, 'Employee not found in this shop');
    }
    return this.repository.findHistoryByEmployee(shopId, employeeId);
  }

  async setCompensation(
    shopId: string,
    employeeId: string,
    createdBy: string,
    dto: CreateCompensationDto,
  ): Promise<IEmployeeCompensation> {
    const employee = await User.findOne({ _id: employeeId, shopId });
    if (!employee) {
      throw new ApiError(404, 'Employee not found in this shop');
    }

    const effectiveFromDate = new Date(dto.effectiveFrom);
    if (isNaN(effectiveFromDate.getTime())) {
      throw new ApiError(400, 'Invalid effectiveFrom date');
    }

    // Close current active profiles before new effective date
    const dayBefore = new Date(effectiveFromDate.getTime() - 1);
    await this.repository.closeActiveProfiles(shopId, employeeId, dayBefore);

    const newComp = await this.repository.create(shopId, employeeId, createdBy, {
      ...dto,
      effectiveFrom: effectiveFromDate,
    });

    await this.auditLog.logAction({
      shopId,
      actorId: createdBy,
      action: 'Set Employee Compensation',
      entity: 'EmployeeCompensation',
      entityId: newComp._id.toString(),
      newValue: newComp.toJSON(),
    });

    return newComp;
  }

  async updateCompensation(
    shopId: string,
    employeeId: string,
    compensationId: string,
    actorId: string,
    dto: UpdateCompensationDto,
  ): Promise<IEmployeeCompensation> {
    const comp = await this.repository.findByIdAndShop(compensationId, shopId);
    if (!comp || comp.employeeId.toString() !== employeeId) {
      throw new ApiError(404, 'Compensation profile not found');
    }

    const oldVal = comp.toJSON();

    if (dto.salaryType !== undefined) comp.salaryType = dto.salaryType;
    if (dto.baseSalary !== undefined) comp.baseSalary = dto.baseSalary;
    if (dto.hourlyRate !== undefined) comp.hourlyRate = dto.hourlyRate;
    if (dto.commissionEnabled !== undefined) comp.commissionEnabled = dto.commissionEnabled;
    if (dto.commissionType !== undefined) comp.commissionType = dto.commissionType;
    if (dto.commissionRate !== undefined) comp.commissionRate = dto.commissionRate;
    if (dto.overtimeEnabled !== undefined) comp.overtimeEnabled = dto.overtimeEnabled;
    if (dto.overtimeMultiplier !== undefined) comp.overtimeMultiplier = dto.overtimeMultiplier;
    if (dto.effectiveFrom !== undefined) comp.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) comp.effectiveTo = new Date(dto.effectiveTo);

    const updated = await comp.save();

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Updated Employee Compensation',
      entity: 'EmployeeCompensation',
      entityId: updated._id.toString(),
      oldValue: oldVal,
      newValue: updated.toJSON(),
    });

    return updated;
  }
}

export const compensationService = new CompensationService();
