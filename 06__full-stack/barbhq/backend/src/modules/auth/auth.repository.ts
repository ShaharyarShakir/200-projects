import { User, type IUser } from '../../models/user.model';
import { Shop, type IShop } from '../../models/shop.model';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  }

  async findUserById(id: string): Promise<IUser | null> {
    return User.findById(id).select('+refreshToken');
  }

  async findUserByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+password');
  }

  async findShopById(id: string): Promise<IShop | null> {
    return Shop.findById(id);
  }

  async storeRefreshToken(userId: string, refreshTokenHash: string | null): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: refreshTokenHash });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }
}

export const authRepository = new AuthRepository();
