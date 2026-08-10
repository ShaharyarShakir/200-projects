import bcrypt from 'bcrypt';
import { authRepository, AuthRepository } from './auth.repository';
import { shopService, ShopService } from '../shop/shop.service';
import { userService, UserService } from '../user/user.service';
import { shopSettingsService } from '../shop-settings/shop-settings.service';
import { businessHoursService } from '../business-hours/business-hours.service';
import { branchService } from '../branch/branch.service';
import { UserRole, type IUser } from '../../models/user.model';
import type { IShop } from '../../models/shop.model';
import { ApiError } from '../../utils/ApiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token';
import type {
  RegisterShopOwnerDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  AuthResponse,
  AuthTokens,
} from './auth.types';

export class AuthService {
  constructor(
    private repository: AuthRepository = authRepository,
    private shopSvc: ShopService = shopService,
    private userSvc: UserService = userService,
  ) {}

  private async generateTokensForUser(user: IUser): Promise<AuthTokens> {
    const payload = {
      id: user._id.toString(),
      shopId: user.shopId.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload, '15m');
    const refreshToken = generateRefreshToken(payload, '30d');

    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.repository.storeRefreshToken(user._id.toString(), hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterShopOwnerDto): Promise<AuthResponse> {
    const existingUser = await this.repository.findUserByEmail(dto.ownerEmail);
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const formattedAddress = dto.address ? { street: dto.address } : undefined;

    const shop = await this.shopSvc.createShop({
      name: dto.shopName,
      slug: dto.shopSlug,
      email: dto.shopEmail || dto.ownerEmail,
      phone: dto.phone,
      address: formattedAddress,
      timezone: dto.timezone || 'UTC',
      currency: dto.currency || 'USD',
    });

    const user = await this.userSvc.createUser({
      shopId: shop._id.toString(),
      firstName: dto.ownerFirstName,
      lastName: dto.ownerLastName,
      email: dto.ownerEmail,
      password: dto.ownerPassword,
      role: UserRole.OWNER,
      phone: dto.phone,
    });

    // Associate ownerId on Shop
    shop.ownerId = user._id;
    await shop.save();

    // Auto-initialize ShopSettings, BusinessHours, and Main Branch
    await shopSettingsService.getSettingsByShopId(shop._id.toString());
    await businessHoursService.getHoursByShopId(shop._id.toString());
    await branchService.createBranch(shop._id.toString(), {
      name: `${shop.name} - Main Branch`,
      phone: dto.phone,
      email: dto.shopEmail || dto.ownerEmail,
      address: formattedAddress,
      timezone: dto.timezone || 'UTC',
    });

    const tokens = await this.generateTokensForUser(user);

    return {
      user: user.toJSON(),
      shop: shop.toJSON(),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.repository.findUserByEmail(dto.email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account is inactive. Please contact your shop administrator.');
    }

    const isPasswordValid = await user.comparePassword(dto.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const shop = await this.repository.findShopById(user.shopId.toString());
    if (!shop || !shop.isActive) {
      throw new ApiError(403, 'Shop associated with this account is inactive or suspended.');
    }

    await this.repository.updateLastLogin(user._id.toString());

    const tokens = await this.generateTokensForUser(user);

    return {
      user: user.toJSON(),
      shop: shop.toJSON(),
      tokens,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.repository.storeRefreshToken(userId, null);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const decoded = verifyRefreshToken(dto.refreshToken);
      const userId = (decoded.id || decoded.userId) as string;

      if (!userId) {
        throw new ApiError(401, 'Invalid token payload');
      }

      const user = await this.repository.findUserById(userId);
      if (!user || !user.isActive || !user.refreshToken) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      const isMatch = await bcrypt.compare(dto.refreshToken, user.refreshToken);
      if (!isMatch) {
        await this.repository.storeRefreshToken(user._id.toString(), null);
        throw new ApiError(401, 'Invalid or revoked refresh token');
      }

      const shop = await this.repository.findShopById(user.shopId.toString());
      if (!shop || !shop.isActive) {
        throw new ApiError(403, 'Shop tenant is inactive');
      }

      return await this.generateTokensForUser(user);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }

  async getMe(userId: string): Promise<{ user: Partial<IUser>; shop: Partial<IShop> }> {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new ApiError(404, 'User not found or inactive');
    }

    const shop = await this.repository.findShopById(user.shopId.toString());
    if (!shop) {
      throw new ApiError(404, 'Shop not found');
    }

    return {
      user: user.toJSON(),
      shop: shop.toJSON(),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const targetUser = await this.repository.findUserByIdWithPassword(userId);
    if (!targetUser) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await targetUser.comparePassword(dto.currentPassword);
    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    targetUser.password = dto.newPassword;
    await targetUser.save();
  }
}

export const authService = new AuthService();
