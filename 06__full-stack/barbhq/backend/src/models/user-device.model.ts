import mongoose, { Schema, Document } from 'mongoose';

export enum DevicePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
}

export interface IUserDevice extends Document {
  userId: mongoose.Types.ObjectId;
  shopId: mongoose.Types.ObjectId;
  platform: DevicePlatform;
  pushToken: string;
  deviceName?: string;
  isActive: boolean;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userDeviceSchema = new Schema<IUserDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: Object.values(DevicePlatform),
      required: true,
    },
    pushToken: {
      type: String,
      required: true,
      trim: true,
    },
    deviceName: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

userDeviceSchema.index({ userId: 1, pushToken: 1 }, { unique: true });

export const UserDevice = mongoose.model<IUserDevice>('UserDevice', userDeviceSchema);
