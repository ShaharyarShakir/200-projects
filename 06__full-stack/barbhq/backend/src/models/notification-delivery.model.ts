import mongoose, { Schema, Document } from 'mongoose';
import { NotificationChannel } from './notification.model';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface INotificationDelivery extends Document {
  notificationId: mongoose.Types.ObjectId;
  channel: NotificationChannel;
  status: DeliveryStatus;
  provider?: string;
  providerMessageId?: string;
  attempts: number;
  lastAttemptAt?: Date | null;
  deliveredAt?: Date | null;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationDeliverySchema = new Schema<INotificationDelivery>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.PENDING,
      required: true,
    },
    provider: {
      type: String,
      trim: true,
    },
    providerMessageId: {
      type: String,
      trim: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Idempotency boundary: Only one delivery attempt log per notification per channel
notificationDeliverySchema.index({ notificationId: 1, channel: 1 }, { unique: true });

export const NotificationDelivery = mongoose.model<INotificationDelivery>(
  'NotificationDelivery',
  notificationDeliverySchema,
);
