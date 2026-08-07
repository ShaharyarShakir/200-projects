import { UserModel } from './user.model';
import type { IUserDocument } from './user.model';
import type { IUser } from './user.types';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUserDocument> {
    return await UserModel.create(userData);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUserDocument | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  async findByIdAndShop(
    id: string,
    shopId: string,
    includePassword = false,
  ): Promise<IUserDocument | null> {
    const query = UserModel.findOne({ _id: id, shopId });
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  async findByIdGlobal(id: string): Promise<IUserDocument | null> {
    return await UserModel.findById(id);
  }

  async findAllByShop(shopId: string): Promise<IUserDocument[]> {
    return await UserModel.find({ shopId });
  }

  async updateLastLogin(id: string): Promise<void> {
    await UserModel.updateOne({ _id: id }, { lastLogin: new Date() });
  }
}
