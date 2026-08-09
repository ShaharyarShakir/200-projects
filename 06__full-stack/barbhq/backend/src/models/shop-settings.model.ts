import mongoose, { Schema, type Document, Types } from 'mongoose';

export interface IShopSettings extends Document {
  shopId: Types.ObjectId;
  bookingEnabled: boolean;
  onlineBookingEnabled: boolean;
  allowWalkIns: boolean;
  requireCustomerPhone: boolean;
  allowCustomerCancellation: boolean;
  cancellationWindowMinutes: number;
  defaultAppointmentDuration: number;
  taxEnabled: boolean;
  taxRate: number;
  receiptEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shopSettingsSchema = new Schema<IShopSettings>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      unique: true,
      index: true,
    },
    bookingEnabled: {
      type: Boolean,
      default: true,
    },
    onlineBookingEnabled: {
      type: Boolean,
      default: true,
    },
    allowWalkIns: {
      type: Boolean,
      default: true,
    },
    requireCustomerPhone: {
      type: Boolean,
      default: true,
    },
    allowCustomerCancellation: {
      type: Boolean,
      default: true,
    },
    cancellationWindowMinutes: {
      type: Number,
      default: 120,
    },
    defaultAppointmentDuration: {
      type: Number,
      default: 30,
    },
    taxEnabled: {
      type: Boolean,
      default: false,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    receiptEnabled: {
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

export const ShopSettings = mongoose.model<IShopSettings>('ShopSettings', shopSettingsSchema);
