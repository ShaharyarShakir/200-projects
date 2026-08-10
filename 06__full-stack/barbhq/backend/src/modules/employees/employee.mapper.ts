import type { IUser } from '../../models/user.model';

export interface EmployeeResponseDto {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeMapper {
  static toDto(user: IUser): EmployeeResponseDto {
    const json = user.toJSON();
    return {
      id: json.id,
      shopId: json.shopId,
      firstName: json.firstName,
      lastName: json.lastName,
      email: json.email,
      role: json.role,
      phone: json.phone,
      avatar: json.avatar,
      isActive: json.isActive,
      lastLogin: json.lastLogin,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }
}
