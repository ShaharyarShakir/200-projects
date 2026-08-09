import mongoose, { Schema, Document } from 'mongoose';

export interface IChannelPreferences {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

export interface INotificationPreferencesMap {
  employeeLate: IChannelPreferences;
  leaveRequests: IChannelPreferences;
  payroll: IChannelPreferences;
  inventory: IChannelPreferences;
  finance: IChannelPreferences;
}

export interface INotificationPreference extends Document {
  shopId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  preferences: INotificationPreferencesMap;
  createdAt: Date;
  updatedAt: Date;
}

const channelPreferencesSchema = new Schema<IChannelPreferences>(
  {
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
  },
  { _id: false },
);

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    preferences: {
      employeeLate: { type: channelPreferencesSchema, default: () => ({ inApp: true, push: true, email: true }) },
      leaveRequests: { type: channelPreferencesSchema, default: () => ({ inApp: true, push: true, email: true }) },
      payroll: { type: channelPreferencesSchema, default: () => ({ inApp: true, push: true, email: true }) },
      inventory: { type: channelPreferencesSchema, default: () => ({ inApp: true, push: true, email: true }) },
      finance: { type: channelPreferencesSchema, default: () => ({ inApp: true, push: true, email: true }) },
    },
  },
  {
    timestamps: true,
  },
);

notificationPreferenceSchema.index({ shopId: 1, userId: 1 }, { unique: true });

export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema,
);
