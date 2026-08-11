import { EmployeeShift, type IEmployeeShift } from '../../models/employee-shift.model';
import { ShiftException, type IShiftException } from '../../models/shift-exception.model';
import type { CreateShiftDto, UpdateShiftDto, CreateShiftExceptionDto } from './shift.types';

export class ShiftRepository {
  async createShift(shopId: string, data: CreateShiftDto): Promise<IEmployeeShift> {
    const shift = new EmployeeShift({ ...data, shopId });
    return shift.save();
  }

  async findShiftsByShop(shopId: string, employeeId?: string): Promise<IEmployeeShift[]> {
    const query: Record<string, any> = { shopId };
    if (employeeId) query.employeeId = employeeId;
    return EmployeeShift.find(query)
      .populate('employeeId', 'firstName lastName email role')
      .sort({ dayOfWeek: 1 });
  }

  async findShiftByIdAndShop(id: string, shopId: string): Promise<IEmployeeShift | null> {
    return EmployeeShift.findOne({ _id: id, shopId }).populate('employeeId', 'firstName lastName email role');
  }

  async findShiftByEmployeeAndDay(shopId: string, employeeId: string, dayOfWeek: number): Promise<IEmployeeShift | null> {
    return EmployeeShift.findOne({ shopId, employeeId, dayOfWeek });
  }

  async updateShift(id: string, shopId: string, data: UpdateShiftDto): Promise<IEmployeeShift | null> {
    return EmployeeShift.findOneAndUpdate(
      { _id: id, shopId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async deleteShift(id: string, shopId: string): Promise<IEmployeeShift | null> {
    return EmployeeShift.findOneAndDelete({ _id: id, shopId });
  }

  // Shift Exceptions
  async createException(shopId: string, actorId: string, data: CreateShiftExceptionDto): Promise<IShiftException> {
    const exception = new ShiftException({
      ...data,
      shopId,
      createdBy: actorId,
    });
    return exception.save();
  }

  async findExceptionsByShop(shopId: string, employeeId?: string, date?: string): Promise<IShiftException[]> {
    const query: Record<string, any> = { shopId };
    if (employeeId) query.employeeId = employeeId;
    if (date) query.date = date;
    return ShiftException.find(query).sort({ date: -1 });
  }

  async findExceptionByEmployeeAndDate(shopId: string, employeeId: string, date: string): Promise<IShiftException | null> {
    return ShiftException.findOne({ shopId, employeeId, date });
  }
}

export const shiftRepository = new ShiftRepository();
