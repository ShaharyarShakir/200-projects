import { ShopStatus } from '../../models/shop.model';

export { ShopStatus };

export interface ShopAddressDto {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreateShopDto {
  name: string;
  slug?: string;
  email: string;
  phone?: string;
  description?: string;
  address?: ShopAddressDto;
  timezone?: string;
  currency?: string;
  logo?: string;
  coverImage?: string;
  status?: ShopStatus;
  ownerId?: string;
  subscription?: string;
}

export interface UpdateShopDto {
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
  address?: ShopAddressDto;
  timezone?: string;
  currency?: string;
  logo?: string;
  coverImage?: string;
  status?: ShopStatus;
}
