import { payrollRepository, PayrollRepository } from './payroll.repository';
import { compensationRepository, CompensationRepository } from '../compensation/compensation.repository';
import { calculateHourlyPayroll } from './calculators/hourly.calculator';
import { calculateMonthlyPayroll } from './calculators/monthly.calculator';
import { calculateCommission } from './calculators/commission.calculator';
import type { CreatePayrollPeriodDto, CreatePayrollAdjustmentDto } from './payroll.types';
import { PayrollPeriodStatus, type IPayrollPeriod } from '../../models/payroll-period.model';
import { PayrollRecordStatus, type IPayrollRecord } from '../../models/payroll-record.model';
import { AdjustmentType, type IPayrollAdjustment } from '../../models/payroll-adjustment.model';
import { SalaryType } from '../../models/employee-compensation.model';
import { Attendance } from '../../models/attendance.model';
import { User } from '../../models/user.model';
import { auditLogService, AuditLogService } from '../audit-logs/audit-log.service';
import { ApiError } from '../../utils/ApiError';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../../models/notification.model';

export class PayrollService {
  constructor(
    private repository: PayrollRepository = payrollRepository,
    private compRepository: CompensationRepository = compensationRepository,
    private auditLog: AuditLogService = auditLogService,
  ) {}

  async createPeriod(shopId: string, createdBy: string, dto: CreatePayrollPeriodDto): Promise<IPayrollPeriod> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, 'Invalid startDate or endDate');
    }
    if (start > end) {
      throw new ApiError(400, 'startDate cannot be after endDate');
    }

    const overlap = await this.repository.findOverlappingPeriod(shopId, start, end);
    if (overlap) {
      throw new ApiError(400, 'A payroll period overlapping these dates already exists');
    }

    const payDate = dto.payDate ? new Date(dto.payDate) : undefined;
    const period = await this.repository.createPeriod(shopId, createdBy, { startDate: start, endDate: end, payDate });

    await this.auditLog.logAction({
      shopId,
      actorId: createdBy,
      action: 'Create Payroll Period',
      entity: 'PayrollPeriod',
      entityId: period._id.toString(),
      newValue: period.toJSON(),
    });

    return period;
  }

  async getPeriods(shopId: string, status?: PayrollPeriodStatus): Promise<IPayrollPeriod[]> {
    return this.repository.findPeriodsByShop(shopId, status);
  }

  async getPeriodById(id: string, shopId: string): Promise<IPayrollPeriod> {
    const period = await this.repository.findPeriodById(id, shopId);
    if (!period) {
      throw new ApiError(404, 'Payroll period not found');
    }
    return period;
  }

  async processPayrollPeriod(id: string, shopId: string, actorId: string): Promise<IPayrollPeriod> {
    const period = await this.repository.findPeriodById(id, shopId);
    if (!period) {
      throw new ApiError(404, 'Payroll period not found');
    }

    if (period.status === PayrollPeriodStatus.FINALIZED || period.status === PayrollPeriodStatus.PAID) {
      throw new ApiError(400, `Cannot process payroll period with status ${period.status}`);
    }

    await this.repository.updatePeriodStatus(id, shopId, PayrollPeriodStatus.PROCESSING);

    // Fetch active non-owner employees
    const employees = await User.find({ shopId, isActive: true, role: { $ne: 'OWNER' as any } });

    // YYYY-MM-DD string bounds for attendance query
    const startDateStr = period.startDate.toISOString().split('T')[0];
    const endDateStr = period.endDate.toISOString().split('T')[0];

    for (const emp of employees) {
      const empIdStr = emp._id.toString();

      // Find effective compensation
      const comp = await this.compRepository.findEffectiveByDateRange(
        shopId,
        empIdStr,
        period.startDate,
        period.endDate,
      );

      const salaryType = comp?.salaryType || SalaryType.MONTHLY;
      const baseSalary = comp?.baseSalary || 0;
      const hourlyRate = comp?.hourlyRate || 0;
      const overtimeMultiplier = comp?.overtimeMultiplier || 1.5;

      // Query attendance during period
      const attendances = await Attendance.find({
        shopId,
        employeeId: empIdStr,
        date: { $gte: startDateStr, $lte: endDateStr },
      });

      let totalWorkedMinutes = 0;
      let totalOvertimeMinutes = 0;

      for (const att of attendances) {
        totalWorkedMinutes += att.workedMinutes || 0;
        totalOvertimeMinutes += att.overtimeMinutes || 0;
      }

      const regularHours = Math.round((totalWorkedMinutes / 60) * 100) / 100;
      const overtimeHours = Math.round((totalOvertimeMinutes / 60) * 100) / 100;

      // Check existing record & adjustments
      const existingRecord = await this.repository.findRecordByPeriodAndEmployee(shopId, id, empIdStr);
      let bonusAmount = 0;
      let deductionAmount = 0;

      if (existingRecord) {
        const adjustments = await this.repository.findAdjustmentsByRecord(shopId, existingRecord._id.toString());
        for (const adj of adjustments) {
          if (adj.type === AdjustmentType.BONUS) bonusAmount += adj.amount;
          else if (adj.type === AdjustmentType.DEDUCTION) deductionAmount += adj.amount;
          else if (adj.type === AdjustmentType.OVERTIME) bonusAmount += adj.amount;
          else if (adj.type === AdjustmentType.OTHER) bonusAmount += adj.amount;
        }
      }

      const commissionAmount = calculateCommission({
        commissionEnabled: comp?.commissionEnabled,
        commissionRate: comp?.commissionRate,
        revenue: 0, // Placeholder until POS module
      });

      let calcResult;
      if (salaryType === SalaryType.HOURLY) {
        calcResult = calculateHourlyPayroll({
          regularHours,
          overtimeHours,
          hourlyRate,
          overtimeMultiplier,
          commissionAmount,
          bonusAmount,
          deductionAmount,
        });
      } else {
        // MONTHLY or COMMISSION_ONLY
        calcResult = calculateMonthlyPayroll({
          baseSalary: salaryType === SalaryType.COMMISSION_ONLY ? 0 : baseSalary,
          regularHours,
          overtimeHours,
          overtimeMultiplier,
          commissionAmount,
          bonusAmount,
          deductionAmount,
        });
      }

      await this.repository.upsertRecord(shopId, id, empIdStr, {
        salaryType,
        baseSalary: calcResult.baseSalary,
        regularHours: calcResult.regularHours,
        overtimeHours: calcResult.overtimeHours,
        hourlyRate: calcResult.hourlyRate,
        overtimeRate: calcResult.overtimeRate,
        commissionAmount: calcResult.commissionAmount,
        bonusAmount: calcResult.bonusAmount,
        deductionAmount: calcResult.deductionAmount,
        grossPay: calcResult.grossPay,
        netPay: calcResult.netPay,
        status: PayrollRecordStatus.DRAFT,
      });
    }

    const updatedPeriod = await this.repository.findPeriodById(id, shopId);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Process Payroll Period',
      entity: 'PayrollPeriod',
      entityId: id,
      newValue: { status: PayrollPeriodStatus.PROCESSING, processedCount: employees.length },
    });

    // Notify Employees
    const periodName = `${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]}`;
    for (const emp of employees) {
      const rec = await this.repository.findRecordByPeriodAndEmployee(shopId, id, emp._id.toString());
      notificationService.publish({
        shopId,
        type: NotificationType.PAYROLL_PROCESSED,
        recipientIds: [emp._id.toString()],
        data: {
          periodName,
          netPayable: rec?.netPay || 0,
        },
      }).catch((err) => console.error('[Notification Trigger Error]', err));
    }

    return updatedPeriod!;
  }

  async finalizePayrollPeriod(id: string, shopId: string, actorId: string): Promise<IPayrollPeriod> {
    const period = await this.repository.findPeriodById(id, shopId);
    if (!period) {
      throw new ApiError(404, 'Payroll period not found');
    }

    if (period.status === PayrollPeriodStatus.FINALIZED || period.status === PayrollPeriodStatus.PAID) {
      throw new ApiError(400, `Payroll period is already ${period.status}`);
    }

    const records = await this.repository.findRecordsByPeriod(shopId, id);
    if (records.length === 0) {
      throw new ApiError(400, 'Cannot finalize a payroll period without processed records');
    }

    // Update period status & record status to FINALIZED
    const updated = await this.repository.updatePeriodStatus(
      id,
      shopId,
      PayrollPeriodStatus.FINALIZED,
      actorId,
    );

    for (const rec of records) {
      rec.status = PayrollRecordStatus.FINALIZED;
      await rec.save();
    }

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Finalize Payroll Period',
      entity: 'PayrollPeriod',
      entityId: id,
      newValue: { status: PayrollPeriodStatus.FINALIZED, finalizedAt: updated?.finalizedAt },
    });

    // Notify Employees
    const periodName = `${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]}`;
    const empIds = records.map((r) => r.employeeId.toString());
    notificationService.publish({
      shopId,
      type: NotificationType.PAYROLL_FINALIZED,
      recipientIds: empIds,
      data: {
        periodName,
      },
    }).catch((err) => console.error('[Notification Trigger Error]', err));

    return updated!;
  }

  async markPayrollPeriodPaid(id: string, shopId: string, actorId: string): Promise<IPayrollPeriod> {
    const period = await this.repository.findPeriodById(id, shopId);
    if (!period) {
      throw new ApiError(404, 'Payroll period not found');
    }

    if (period.status !== PayrollPeriodStatus.FINALIZED) {
      throw new ApiError(400, 'Only FINALIZED payroll periods can be marked as PAID');
    }

    const updated = await this.repository.updatePeriodStatus(id, shopId, PayrollPeriodStatus.PAID);

    const records = await this.repository.findRecordsByPeriod(shopId, id);
    for (const rec of records) {
      rec.status = PayrollRecordStatus.PAID;
      await rec.save();
    }

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Mark Payroll Period Paid',
      entity: 'PayrollPeriod',
      entityId: id,
      newValue: { status: PayrollPeriodStatus.PAID },
    });

    return updated!;
  }

  async getPeriodRecords(shopId: string, periodId: string): Promise<IPayrollRecord[]> {
    return this.repository.findRecordsByPeriod(shopId, periodId);
  }

  async getEmployeeRecordInPeriod(
    shopId: string,
    periodId: string,
    employeeId: string,
  ): Promise<IPayrollRecord> {
    const record = await this.repository.findRecordByPeriodAndEmployee(shopId, periodId, employeeId);
    if (!record) {
      throw new ApiError(404, 'Payroll record not found for this employee in this period');
    }
    return record;
  }

  async getMyPaystubs(shopId: string, employeeId: string): Promise<IPayrollRecord[]> {
    return this.repository.findEmployeePaystubs(shopId, employeeId);
  }

  async addAdjustment(
    shopId: string,
    payrollRecordId: string,
    actorId: string,
    dto: CreatePayrollAdjustmentDto,
  ): Promise<IPayrollAdjustment> {
    const record = await this.repository.findRecordById(payrollRecordId, shopId);
    if (!record) {
      throw new ApiError(404, 'Payroll record not found');
    }

    const period = await this.repository.findPeriodById(record.payrollPeriodId.toString(), shopId);
    if (period && (period.status === PayrollPeriodStatus.FINALIZED || period.status === PayrollPeriodStatus.PAID)) {
      throw new ApiError(400, 'Cannot add adjustments to finalized or paid payroll periods');
    }

    const adjustment = await this.repository.createAdjustment(shopId, payrollRecordId, actorId, dto);

    // Recalculate record bonus / deduction / gross / net
    if (dto.type === AdjustmentType.BONUS || dto.type === AdjustmentType.OVERTIME || dto.type === AdjustmentType.OTHER) {
      record.bonusAmount += dto.amount;
    } else if (dto.type === AdjustmentType.DEDUCTION) {
      record.deductionAmount += dto.amount;
    }

    record.grossPay = Math.round((record.baseSalary + (record.overtimeHours * (record.overtimeRate || 0)) + record.commissionAmount + record.bonusAmount) * 100) / 100;
    record.netPay = Math.max(0, Math.round((record.grossPay - record.deductionAmount) * 100) / 100);
    await record.save();

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Add Payroll Adjustment',
      entity: 'PayrollAdjustment',
      entityId: adjustment._id.toString(),
      newValue: adjustment.toJSON(),
    });

    return adjustment;
  }

  async getAdjustments(shopId: string, payrollRecordId: string): Promise<IPayrollAdjustment[]> {
    return this.repository.findAdjustmentsByRecord(shopId, payrollRecordId);
  }

  async deleteAdjustment(id: string, shopId: string, actorId: string): Promise<void> {
    const adjustment = await this.repository.findAdjustmentById(id, shopId);
    if (!adjustment) {
      throw new ApiError(404, 'Adjustment not found');
    }

    const record = await this.repository.findRecordById(adjustment.payrollRecordId.toString(), shopId);
    if (record) {
      const period = await this.repository.findPeriodById(record.payrollPeriodId.toString(), shopId);
      if (period && (period.status === PayrollPeriodStatus.FINALIZED || period.status === PayrollPeriodStatus.PAID)) {
        throw new ApiError(400, 'Cannot delete adjustments from finalized or paid payroll periods');
      }

      if (adjustment.type === AdjustmentType.BONUS || adjustment.type === AdjustmentType.OVERTIME || adjustment.type === AdjustmentType.OTHER) {
        record.bonusAmount = Math.max(0, record.bonusAmount - adjustment.amount);
      } else if (adjustment.type === AdjustmentType.DEDUCTION) {
        record.deductionAmount = Math.max(0, record.deductionAmount - adjustment.amount);
      }

      record.grossPay = Math.round((record.baseSalary + (record.overtimeHours * (record.overtimeRate || 0)) + record.commissionAmount + record.bonusAmount) * 100) / 100;
      record.netPay = Math.max(0, Math.round((record.grossPay - record.deductionAmount) * 100) / 100);
      await record.save();
    }

    const oldVal = adjustment.toJSON();
    await this.repository.deleteAdjustment(id, shopId);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Delete Payroll Adjustment',
      entity: 'PayrollAdjustment',
      entityId: id,
      oldValue: oldVal,
    });
  }

  async getPayrollDashboard(shopId: string): Promise<Record<string, any>> {
    const periods = await this.repository.findPeriodsByShop(shopId);
    const currentPeriod = periods.length > 0 ? periods[0] : null;
    const previousPeriod = periods.length > 1 ? periods[1] : null;

    let currentMetrics = {
      id: currentPeriod ? currentPeriod._id.toString() : null,
      status: currentPeriod ? currentPeriod.status : null,
      employeeCount: 0,
      grossPay: 0,
      deductions: 0,
      bonuses: 0,
      netPay: 0,
    };

    if (currentPeriod) {
      const records = await this.repository.findRecordsByPeriod(shopId, currentPeriod._id.toString());
      currentMetrics.employeeCount = records.length;
      for (const rec of records) {
        currentMetrics.grossPay += rec.grossPay;
        currentMetrics.deductions += rec.deductionAmount;
        currentMetrics.bonuses += rec.bonusAmount;
        currentMetrics.netPay += rec.netPay;
      }
    }

    let previousNetPay = 0;
    if (previousPeriod) {
      const prevRecords = await this.repository.findRecordsByPeriod(shopId, previousPeriod._id.toString());
      for (const rec of prevRecords) {
        previousNetPay += rec.netPay;
      }
    }

    return {
      currentPeriod: currentMetrics,
      previousPeriod: {
        id: previousPeriod ? previousPeriod._id.toString() : null,
        netPay: previousNetPay,
      },
    };
  }
}

export const payrollService = new PayrollService();
