import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  EMPLOYEE_LATE = 'EMPLOYEE_LATE',
  LEAVE_REQUESTED = 'LEAVE_REQUESTED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  PAYROLL_PROCESSED = 'PAYROLL_PROCESSED',
  PAYROLL_FINALIZED = 'PAYROLL_FINALIZED',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  EXPENSE_CREATED = 'EXPENSE_CREATED',
  SALE_COMPLETED = 'SALE_COMPLETED',
  CASH_SESSION_CLOSED = 'CASH_SESSION_CLOSED',
  SYSTEM = 'SYSTEM',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  PARTIALLY_SENT = 'PARTIALLY_SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface INotification extends Document {
  shopId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels: NotificationChannel[];
  status: NotificationStatus;
  readAt?: Date | null;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    channels: [
      {
        type: String,
        enum: Object.values(NotificationChannel),
        required: true,
      },
    ],
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
      required: true,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compounded indexes for fast user notification lookups & filtering
notificationSchema.index({ shopId: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({ shopId: 1, recipientId: 1, readAt: 1 });
notificationSchema.index({ shopId: 1, type: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
