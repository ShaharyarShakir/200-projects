import mongoose from 'mongoose';
import { NotificationChannel, NotificationStatus, NotificationType } from '../../models/notification.model';
import { DevicePlatform } from '../../models/user-device.model';

export interface NotificationEvent {
  shopId: mongoose.Types.ObjectId | string;
  type: NotificationType;
  recipientIds: (mongoose.Types.ObjectId | string)[];
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
}

export interface SendNotificationInput {
  shopId: mongoose.Types.ObjectId | string;
  recipientId: mongoose.Types.ObjectId | string;
  type: NotificationType;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface RegisterDeviceDto {
  platform: DevicePlatform;
  pushToken: string;
  deviceName?: string;
}

export interface NotificationQueryFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface DeliveryJobPayload {
  notificationId: string;
  channel: NotificationChannel;
  attempts?: number;
}
