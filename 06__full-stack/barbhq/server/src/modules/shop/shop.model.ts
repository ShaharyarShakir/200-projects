import { Schema, model, Document } from 'mongoose';
import type { IShop } from './shop.types';

export interface IShopDocument extends IShop, Document {
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShopDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    timezone: { type: String, required: true, default: 'UTC' },
    currency: { type: String, required: true, default: 'USD' },
    subscription: { type: String, required: true, default: 'free' },
    isActive: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
  },
);

export const ShopModel = model<IShopDocument>('Shop', shopSchema);
