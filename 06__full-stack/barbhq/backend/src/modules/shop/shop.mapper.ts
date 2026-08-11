import type { IShop } from '../../models/shop.model';

export interface ShopResponseDto {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  timezone: string;
  currency: string;
  logo?: string;
  coverImage?: string;
  status: string;
  ownerId?: string;
  subscription: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ShopMapper {
  static toDto(shop: IShop): ShopResponseDto {
    const json = shop.toJSON();
    return {
      id: json.id,
      name: json.name,
      slug: json.slug,
      email: json.email,
      phone: json.phone,
      description: json.description,
      address: json.address,
      timezone: json.timezone,
      currency: json.currency,
      logo: json.logo,
      coverImage: json.coverImage,
      status: json.status,
      ownerId: json.ownerId,
      subscription: json.subscription,
      isActive: json.isActive,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }
}
