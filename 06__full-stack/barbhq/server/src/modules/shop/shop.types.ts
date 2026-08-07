export interface IShop {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  timezone: string;
  currency: string;
  subscription: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
