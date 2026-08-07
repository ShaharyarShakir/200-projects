import { RefreshTokenModel } from './auth.model';
import type { IRefreshTokenDocument } from './auth.model';

export class AuthRepository {
  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<IRefreshTokenDocument> {
    return await RefreshTokenModel.create({
      userId,
      token,
      expiresAt,
    });
  }

  async findRefreshToken(token: string): Promise<IRefreshTokenDocument | null> {
    return await RefreshTokenModel.findOne({ token });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await RefreshTokenModel.deleteOne({ token });
  }

  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await RefreshTokenModel.deleteMany({ userId: userId as any });
  }
}
