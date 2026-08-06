import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import type { IUser } from '../interfaces/user.interface';
import { ApiError } from '../utils/ApiError';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async registerUser(userData: IUser) {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ApiError(400, 'User already exists with this email');
    }

    let hashedPassword = userData.password;
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }

    const newUser = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    const userObj = newUser.toObject();
    delete userObj.password;
    return userObj;
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map((user) => {
      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    });
  }
}
