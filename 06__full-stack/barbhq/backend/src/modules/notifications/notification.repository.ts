import mongoose from 'mongoose';
import type { FilterQuery } from 'mongoose';
import {
  Notification,
  NotificationStatus,
  NotificationType,
  type INotification,
} from '../../models/notification.model';
import {
  NotificationDelivery,
  DeliveryStatus,
  type INotificationDelivery,
} from '../../models/notification-delivery.model';
import { UserDevice, DevicePlatform, type IUserDevice } from '../../models/user-device.model';


export class NotificationRepository {
  async createNotification(data: Partial<INotification>): Promise<INotification> {
    return await Notification.create(data);
  }

  async findNotificationById(
    id: mongoose.Types.ObjectId | string,
    shopId?: mongoose.Types.ObjectId | string,
  ): Promise<INotification | null> {
    const query: any = { _id: id };
    if (shopId) {
      query.shopId = shopId;
    }
    return await Notification.findOne(query);
  }


  async findUserNotifications(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
    filters: {
      status?: NotificationStatus;
      type?: NotificationType;
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    const query: FilterQuery<INotification> = {
      recipientId: userId,
      shopId,
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.unreadOnly) {
      query.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: userId, shopId, readAt: null }),
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(
    id: mongoose.Types.ObjectId | string,
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<INotification | null> {
    return await Notification.findOneAndUpdate(
      { _id: id, recipientId: userId, shopId },
      { readAt: new Date() },
      { new: true },
    );
  }

  async markAllAsRead(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<number> {
    const result = await Notification.updateMany(
      { recipientId: userId, shopId, readAt: null },
      { readAt: new Date() },
    );
    return result.modifiedCount;
  }

  async createDeliveryRecord(data: Partial<INotificationDelivery>): Promise<INotificationDelivery> {
    return await NotificationDelivery.create(data);
  }

  async findDeliveryRecord(
    notificationId: mongoose.Types.ObjectId | string,
    channel: string,
  ): Promise<INotificationDelivery | null> {
    return await NotificationDelivery.findOne({ notificationId, channel });
  }

  async updateDeliveryRecord(
    deliveryId: mongoose.Types.ObjectId | string,
    update: Partial<INotificationDelivery>,
  ): Promise<INotificationDelivery | null> {
    return await NotificationDelivery.findByIdAndUpdate(deliveryId, update, { new: true });
  }

  async updateNotificationStatus(
    notificationId: mongoose.Types.ObjectId | string,
    status: NotificationStatus,
    sentAt?: Date,
  ): Promise<INotification | null> {
    const update: any = { status };
    if (sentAt) update.sentAt = sentAt;
    return await Notification.findByIdAndUpdate(notificationId, update, { new: true });
  }

  async registerUserDevice(data: {
    userId: mongoose.Types.ObjectId | string;
    shopId: mongoose.Types.ObjectId | string;
    platform: DevicePlatform;
    pushToken: string;
    deviceName?: string;
  }): Promise<IUserDevice> {
    const userIdObj = typeof data.userId === 'string' ? new mongoose.Types.ObjectId(data.userId) : data.userId;
    const shopIdObj = typeof data.shopId === 'string' ? new mongoose.Types.ObjectId(data.shopId) : data.shopId;

    return await UserDevice.findOneAndUpdate(
      { userId: userIdObj, pushToken: data.pushToken },
      {
        userId: userIdObj,
        shopId: shopIdObj,
        platform: data.platform,
        deviceName: data.deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' },
    );
  }

  async getUserDevices(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<IUserDevice[]> {
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const shopIdObj = typeof shopId === 'string' ? new mongoose.Types.ObjectId(shopId) : shopId;
    return await UserDevice.find({ userId: userIdObj, shopId: shopIdObj, isActive: true });
  }

  async removeUserDevice(
    deviceId: mongoose.Types.ObjectId | string,
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<boolean> {
    const deviceIdObj = typeof deviceId === 'string' ? new mongoose.Types.ObjectId(deviceId) : deviceId;
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const shopIdObj = typeof shopId === 'string' ? new mongoose.Types.ObjectId(shopId) : shopId;
    const result = await UserDevice.deleteOne({ _id: deviceIdObj, userId: userIdObj, shopId: shopIdObj });
    return result.deletedCount > 0;
  }
}


export const notificationRepository = new NotificationRepository();
