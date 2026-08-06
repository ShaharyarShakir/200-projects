import { UserModel } from '../models/user.model';
import type { IUserDocument } from '../models/user.model';
import type { IUser } from '../interfaces/user.interface';

export class UserRepository {
  async create(userData: IUser): Promise<IUserDocument> {
    return await UserModel.create(userData);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await UserModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return await UserModel.findById(id);
  }

  async findAll(): Promise<IUserDocument[]> {
    return await UserModel.find({});
  }
}
