import { z } from 'zod';
import { ShopStatus } from '../../models/shop.model';

export const shopAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const createShopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').optional(),
  email: z.string().email('Invalid shop email address'),
  phone: z.string().optional(),
  description: z.string().optional(),
  address: shopAddressSchema.optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.nativeEnum(ShopStatus).optional(),
});

export const updateShopSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email('Invalid shop email address').optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  address: shopAddressSchema.optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.nativeEnum(ShopStatus).optional(),
});
