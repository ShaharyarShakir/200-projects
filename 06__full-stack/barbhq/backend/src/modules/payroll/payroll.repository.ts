import { PayrollPeriod, PayrollPeriodStatus, type IPayrollPeriod } from '../../models/payroll-period.model';
import { PayrollRecord, type IPayrollRecord } from '../../models/payroll-record.model';
import { PayrollAdjustment, type IPayrollAdjustment } from '../../models/payroll-adjustment.model';

export class PayrollRepository {
  // --- Periods ---
  async createPeriod(
    shopId: string,
    createdBy: string,
    data: { startDate: Date; endDate: Date; payDate?: Date },
  ): Promise<IPayrollPeriod> {
    const period = new PayrollPeriod({
      shopId,
      createdBy,
      startDate: data.startDate,
      endDate: data.endDate,
      payDate: data.payDate,
      status: PayrollPeriodStatus.OPEN,
    });
    return period.save();
  }

  async findPeriodsByShop(shopId: string, status?: PayrollPeriodStatus): Promise<IPayrollPeriod[]> {
    const query: Record<string, any> = { shopId };
    if (status) query.status = status;
    return PayrollPeriod.find(query).sort({ startDate: -1 });
  }

  async findPeriodById(id: string, shopId: string): Promise<IPayrollPeriod | null> {
    return PayrollPeriod.findOne({ _id: id, shopId });
  }

  async findOverlappingPeriod(shopId: string, startDate: Date, endDate: Date): Promise<IPayrollPeriod | null> {
    return PayrollPeriod.findOne({
      shopId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
  }

  async updatePeriodStatus(
    id: string,
    shopId: string,
    status: PayrollPeriodStatus,
    finalizedBy?: string,
  ): Promise<IPayrollPeriod | null> {
    const updateData: Record<string, any> = { status };
    if (finalizedBy) {
      updateData.finalizedBy = finalizedBy;
      updateData.finalizedAt = new Date();
    }
    return PayrollPeriod.findOneAndUpdate({ _id: id, shopId }, { $set: updateData }, { returnDocument: 'after' });
  }

  // --- Records ---
  async upsertRecord(
    shopId: string,
    payrollPeriodId: string,
    employeeId: string,
    data: Partial<IPayrollRecord>,
  ): Promise<IPayrollRecord> {
    return PayrollRecord.findOneAndUpdate(
      { shopId, payrollPeriodId, employeeId },
      { $set: { ...data, shopId, payrollPeriodId, employeeId, calculatedAt: new Date() } },
      { returnDocument: 'after', upsert: true, runValidators: true },
    );
  }

  async findRecordsByPeriod(shopId: string, payrollPeriodId: string): Promise<IPayrollRecord[]> {
    return PayrollRecord.find({ shopId, payrollPeriodId })
      .populate('employeeId', 'firstName lastName email role')
      .sort({ createdAt: 1 });
  }

  async findRecordByPeriodAndEmployee(
    shopId: string,
    payrollPeriodId: string,
    employeeId: string,
  ): Promise<IPayrollRecord | null> {
    return PayrollRecord.findOne({ shopId, payrollPeriodId, employeeId })
      .populate('employeeId', 'firstName lastName email role')
      .populate('payrollPeriodId');
  }

  async findRecordById(id: string, shopId: string): Promise<IPayrollRecord | null> {
    return PayrollRecord.findOne({ _id: id, shopId });
  }

  async findEmployeePaystubs(shopId: string, employeeId: string): Promise<IPayrollRecord[]> {
    return PayrollRecord.find({ shopId, employeeId })
      .populate('payrollPeriodId')
      .sort({ createdAt: -1 });
  }

  // --- Adjustments ---
  async createAdjustment(
    shopId: string,
    payrollRecordId: string,
    createdBy: string,
    data: any,
  ): Promise<IPayrollAdjustment> {
    const adjustment = new PayrollAdjustment({
      ...data,
      shopId,
      payrollRecordId,
      createdBy,
    });
    return adjustment.save();
  }

  async findAdjustmentsByRecord(shopId: string, payrollRecordId: string): Promise<IPayrollAdjustment[]> {
    return PayrollAdjustment.find({ shopId, payrollRecordId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: 1 });
  }

  async findAdjustmentById(id: string, shopId: string): Promise<IPayrollAdjustment | null> {
    return PayrollAdjustment.findOne({ _id: id, shopId });
  }

  async deleteAdjustment(id: string, shopId: string): Promise<IPayrollAdjustment | null> {
    return PayrollAdjustment.findOneAndDelete({ _id: id, shopId });
  }
}

export const payrollRepository = new PayrollRepository();
