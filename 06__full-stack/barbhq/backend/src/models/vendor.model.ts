import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface IVendor extends Document {
  shopId: Types.ObjectId;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
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
        ret.shopId = ret.shopId ? ret.shopId.toString() : ret.shopId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

vendorSchema.index({ shopId: 1, name: 1 }, { unique: true });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);
