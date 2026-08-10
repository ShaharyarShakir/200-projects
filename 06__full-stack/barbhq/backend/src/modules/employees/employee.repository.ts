import { User, type IUser } from '../../models/user.model';
import type { CreateEmployeeDto, UpdateEmployeeDto } from './employee.types';

export class EmployeeRepository {
  async create(shopId: string, data: CreateEmployeeDto): Promise<IUser> {
    const defaultPassword = data.password || 'Temporary123!';
    const user = new User({
      ...data,
      shopId,
      password: defaultPassword,
    });
    return user.save();
  }

  async findByShop(shopId: string): Promise<IUser[]> {
    return User.find({ shopId }).sort({ createdAt: -1 });
  }

  async findByIdAndShop(id: string, shopId: string): Promise<IUser | null> {
    return User.findOne({ _id: id, shopId });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async update(id: string, shopId: string, data: UpdateEmployeeDto): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { _id: id, shopId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }
}

export const employeeRepository = new EmployeeRepository();
