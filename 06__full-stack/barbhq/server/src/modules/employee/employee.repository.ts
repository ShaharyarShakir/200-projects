import { EmployeeModel } from './employee.model';
import type { IEmployeeDocument } from './employee.model';
import type { IEmployee } from './employee.types';

export class EmployeeRepository {
  async create(employeeData: Partial<IEmployee>): Promise<IEmployeeDocument> {
    return await EmployeeModel.create(employeeData);
  }

  async findById(id: string, shopId: string): Promise<IEmployeeDocument | null> {
    return await EmployeeModel.findOne({ _id: id, shopId });
  }

  async findByEmail(email: string, shopId: string): Promise<IEmployeeDocument | null> {
    return await EmployeeModel.findOne({ email: email.toLowerCase(), shopId });
  }

  async findAll(shopId: string): Promise<IEmployeeDocument[]> {
    return await EmployeeModel.find({ shopId });
  }

  async update(
    id: string,
    shopId: string,
    employeeData: Partial<IEmployee>,
  ): Promise<IEmployeeDocument | null> {
    return await EmployeeModel.findOneAndUpdate(
      { _id: id, shopId },
      { $set: employeeData },
      { new: true },
    );
  }

  async deactivate(
    id: string,
    shopId: string,
    updatedBy: string,
  ): Promise<IEmployeeDocument | null> {
    return await EmployeeModel.findOneAndUpdate(
      { _id: id, shopId },
      { $set: { status: 'INACTIVE' as any, updatedBy: updatedBy as any } },
      { new: true },
    );
  }

  async exists(email: string, shopId: string): Promise<boolean> {
    const count = await EmployeeModel.countDocuments({ email: email.toLowerCase(), shopId });
    return count > 0;
  }

  async countByShop(shopId: string): Promise<number> {
    return await EmployeeModel.countDocuments({ shopId });
  }
}
