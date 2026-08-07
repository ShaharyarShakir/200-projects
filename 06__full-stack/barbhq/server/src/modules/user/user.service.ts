import { UserRepository } from './user.repository';
import type { IUserDocument } from './user.model';
import { ApiError } from '../../utils/ApiError';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUserById(id: string, shopId: string): Promise<IUserDocument> {
    const user = await this.userRepository.findByIdAndShop(id, shopId);
    if (!user) {
      throw new ApiError(404, 'User not found or access denied');
    }
    return user;
  }

  async getAllUsersByShop(shopId: string): Promise<IUserDocument[]> {
    return await this.userRepository.findAllByShop(shopId);
  }
}
