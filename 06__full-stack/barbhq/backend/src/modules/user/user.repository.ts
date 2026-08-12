import { User, type IUser } from '../../models/user.model';
import type { CreateUserDto, UpdateUserDto } from './user.types';

export class UserRepository {
  async create(data: CreateUserDto): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByIdAndShop(id: string, shopId: string): Promise<IUser | null> {
    return User.findOne({ _id: id, shopId });
  }

  async findAllByShop(shopId: string): Promise<IUser[]> {
    return User.find({ shopId }).sort({ createdAt: -1 });
  }

  async update(id: string, shopId: string, data: UpdateUserDto): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { _id: id, shopId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await User.findByIdAndUpdate(id, { refreshToken });
  }

  async delete(id: string, shopId: string): Promise<IUser | null> {
    return User.findOneAndUpdate({ _id: id, shopId }, { isActive: false }, { new: true });
  }
}

export const userRepository = new UserRepository();
