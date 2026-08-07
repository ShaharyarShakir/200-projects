import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../../config/env';
import { ShopRepository } from '../shop/shop.repository';
import { UserRepository } from '../user/user.repository';
import { AuthRepository } from './auth.repository';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../user/user.types';
import type { IAuthResponse, ITokenPayload } from './auth.types';

export class AuthService {
  private shopRepository: ShopRepository;
  private userRepository: UserRepository;
  private authRepository: AuthRepository;

  constructor() {
    this.shopRepository = new ShopRepository();
    this.userRepository = new UserRepository();
    this.authRepository = new AuthRepository();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokensResponse(user: any): Promise<IAuthResponse> {
    const payload: ITokenPayload = {
      id: user._id.toString(),
      shopId: user.shopId.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const hashed = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.authRepository.saveRefreshToken(user._id.toString(), hashed, expiresAt);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        shopId: user.shopId.toString(),
      },
    };
  }

  async registerOwner(
    shopData: { name: string; slug: string; email: string },
    ownerData: { firstName: string; lastName: string; email: string; password: string },
  ): Promise<IAuthResponse> {
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(ownerData.email);
    if (existingUser) {
      throw new ApiError(400, 'Email already exists');
    }

    // 2. Check if shop slug is taken
    const existingShop = await this.shopRepository.findBySlug(shopData.slug);
    if (existingShop) {
      throw new ApiError(400, 'Shop slug is already in use');
    }

    // 3. Create Shop
    const shop = await this.shopRepository.create({
      name: shopData.name,
      slug: shopData.slug,
      email: shopData.email,
      timezone: 'UTC',
      currency: 'USD',
      subscription: 'free',
      isActive: true,
    });

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerData.password, salt);

    // 5. Create Owner
    const owner = await this.userRepository.create({
      shopId: shop._id.toString(),
      firstName: ownerData.firstName,
      lastName: ownerData.lastName,
      email: ownerData.email,
      password: hashedPassword,
      role: UserRole.OWNER,
      isActive: true,
    });

    // 6. Return generated tokens
    return await this.generateTokensResponse(owner);
  }

  async login(credentials: { email: string; password?: string }): Promise<IAuthResponse> {
    const user = await this.userRepository.findByEmail(credentials.email, true);
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Inactive account. Please contact support.');
    }

    if (!credentials.password || !user.password) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(credentials.password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Update lastLogin
    await this.userRepository.updateLastLogin(user._id.toString());

    return await this.generateTokensResponse(user);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const hashed = this.hashToken(rawRefreshToken);
    await this.authRepository.deleteRefreshToken(hashed);
  }

  async refreshTokens(rawRefreshToken: string): Promise<IAuthResponse> {
    const hashed = this.hashToken(rawRefreshToken);
    const record = await this.authRepository.findRefreshToken(hashed);
    if (!record) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    if (new Date() > record.expiresAt) {
      await this.authRepository.deleteRefreshToken(hashed);
      throw new ApiError(401, 'Refresh token has expired');
    }

    const user = await this.userRepository.findByIdGlobal(record.userId.toString());
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account is inactive or not found');
    }

    // Token rotation
    await this.authRepository.deleteRefreshToken(hashed);

    return await this.generateTokensResponse(user);
  }

  async changePassword(
    userId: string,
    shopId: string,
    data: { oldPassword?: string; newPassword?: string },
  ): Promise<void> {
    const user = await this.userRepository.findByIdAndShop(userId, shopId, true);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!data.oldPassword || !data.newPassword || !user.password) {
      throw new ApiError(400, 'Invalid parameters');
    }

    const isMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Invalid old password');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    // Revoke other sessions on password change
    await this.authRepository.deleteUserRefreshTokens(userId);
  }
}
