import { userRepository, UserRepository } from './user.repository';
import type { CreateUserDto, UpdateUserDto } from './user.types';
import { ApiError } from '../../utils/ApiError';
import type { IUser } from '../../models/user.model';

export class UserService {
  constructor(private repository: UserRepository = userRepository) {}

  async createUser(dto: CreateUserDto): Promise<IUser> {
    const existingUser = await this.repository.findByEmail(dto.email);
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }
    return this.repository.create(dto);
  }

  async getUserById(id: string, shopId: string): Promise<IUser> {
    const user = await this.repository.findByIdAndShop(id, shopId);
    if (!user) {
      throw new ApiError(404, 'User not found in this shop');
    }
    return user;
  }

  async getUsersByShop(shopId: string): Promise<IUser[]> {
    return this.repository.findAllByShop(shopId);
  }

  async updateUser(id: string, shopId: string, dto: UpdateUserDto): Promise<IUser> {
    const user = await this.repository.update(id, shopId, dto);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }
}

export const userService = new UserService();
