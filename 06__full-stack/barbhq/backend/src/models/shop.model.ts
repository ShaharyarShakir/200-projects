import mongoose, { Schema, type Document, Types } from 'mongoose';

export enum ShopStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface IShopAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface IShop extends Document {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  description?: string;
  address?: IShopAddress;
  timezone: string;
  currency: string;
  logo?: string;
  coverImage?: string;
  status: ShopStatus;
  ownerId?: Types.ObjectId;
  subscription: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Shop slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Shop email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    logo: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(ShopStatus),
      default: ShopStatus.ACTIVE,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    subscription: {
      type: String,
      enum: ['FREE', 'TRIAL', 'PRO', 'ENTERPRISE'],
      default: 'TRIAL',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.ownerId) {
          ret.ownerId = ret.ownerId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Shop = mongoose.model<IShop>('Shop', shopSchema);
