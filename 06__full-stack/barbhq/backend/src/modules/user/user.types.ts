import { UserRole } from '../../models/user.model';

export { UserRole };

export interface CreateUserDto {
  shopId: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
}
