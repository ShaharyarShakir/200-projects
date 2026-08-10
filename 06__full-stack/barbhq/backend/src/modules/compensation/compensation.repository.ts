import { EmployeeCompensation, type IEmployeeCompensation } from '../../models/employee-compensation.model';

export class CompensationRepository {
  async create(shopId: string, employeeId: string, createdBy: string, data: any): Promise<IEmployeeCompensation> {
    const compensation = new EmployeeCompensation({
      ...data,
      shopId,
      employeeId,
      createdBy,
    });
    return compensation.save();
  }

  async findActiveByEmployee(shopId: string, employeeId: string, date: Date = new Date()): Promise<IEmployeeCompensation | null> {
    return EmployeeCompensation.findOne({
      shopId,
      employeeId,
      effectiveFrom: { $lte: date },
      $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: date } }],
    }).sort({ effectiveFrom: -1 });
  }

  async findEffectiveByDateRange(shopId: string, employeeId: string, startDate: Date, endDate: Date): Promise<IEmployeeCompensation | null> {
    // Find the compensation profile active at the start of the period or most recent before/during
    return EmployeeCompensation.findOne({
      shopId,
      employeeId,
      effectiveFrom: { $lte: endDate },
      $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: startDate } }],
    }).sort({ effectiveFrom: -1 });
  }

  async findHistoryByEmployee(shopId: string, employeeId: string): Promise<IEmployeeCompensation[]> {
    return EmployeeCompensation.find({ shopId, employeeId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ effectiveFrom: -1 });
  }

  async findByIdAndShop(id: string, shopId: string): Promise<IEmployeeCompensation | null> {
    return EmployeeCompensation.findOne({ _id: id, shopId });
  }

  async closeActiveProfiles(shopId: string, employeeId: string, closingDate: Date): Promise<void> {
    await EmployeeCompensation.updateMany(
      {
        shopId,
        employeeId,
        $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gt: closingDate } }],
      },
      {
        $set: { effectiveTo: closingDate },
      },
    );
  }
}

export const compensationRepository = new CompensationRepository();
