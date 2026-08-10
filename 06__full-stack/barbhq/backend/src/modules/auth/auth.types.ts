import type { IUser } from '../../models/user.model';
import type { IShop } from '../../models/shop.model';

export interface RegisterShopOwnerDto {
  shopName: string;
  shopSlug?: string;
  shopEmail?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Partial<IUser>;
  shop: Partial<IShop>;
  tokens: AuthTokens;
}
