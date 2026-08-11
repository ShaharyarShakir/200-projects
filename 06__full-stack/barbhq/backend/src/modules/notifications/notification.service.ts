import mongoose from 'mongoose';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  type INotification,
} from '../../models/notification.model';
import { notificationRepository } from './notification.repository';
import { preferenceService } from './preferences/preference.service';
import { templateService } from './templates/template.service';
import { notificationWorker } from './workers/notification.worker';
import type {
  NotificationEvent,
  SendNotificationInput,
  RegisterDeviceDto,
  NotificationQueryFilters,
} from './notification.types';
import { DeliveryStatus } from '../../models/notification-delivery.model';
import type { IUserDevice } from '../../models/user-device.model';


export class NotificationService {
  /**
   * Internal Event Publisher: Used by other domain modules (Attendance, Leave, Payroll, Inventory, POS, etc.)
   */
  async publish(event: NotificationEvent): Promise<INotification[]> {
    const notifications: INotification[] = [];

    for (const recipientId of event.recipientIds) {
      const created = await this.send({
        shopId: event.shopId,
        recipientId,
        type: event.type,
        data: event.data,
        channels: event.channels,
      });
      if (created) {
        notifications.push(created);
      }
    }

    return notifications;
  }

  /**
   * Internal Send API: Processes preferences, templates, and dispatches delivery jobs.
   */
  async send(input: SendNotificationInput): Promise<INotification | null> {
    const { shopId, recipientId, type, data = {}, scheduledAt, expiresAt } = input;

    // 1. Fetch recipient notification preferences
    const prefDoc = await preferenceService.getPreferences(recipientId, shopId);
    const prefs = prefDoc.preferences;

    // Map notification type to preference category
    let categoryPref = prefs.system || { inApp: true, push: true, email: true };
    if (
      type === NotificationType.EMPLOYEE_LATE
    ) {
      categoryPref = prefs.employeeLate;
    } else if (
      type === NotificationType.LEAVE_REQUESTED ||
      type === NotificationType.LEAVE_APPROVED ||
      type === NotificationType.LEAVE_REJECTED
    ) {
      categoryPref = prefs.leaveRequests;
    } else if (
      type === NotificationType.PAYROLL_PROCESSED ||
      type === NotificationType.PAYROLL_FINALIZED
    ) {
      categoryPref = prefs.payroll;
    } else if (
      type === NotificationType.LOW_STOCK ||
      type === NotificationType.OUT_OF_STOCK
    ) {
      categoryPref = prefs.inventory;
    } else if (
      type === NotificationType.EXPENSE_CREATED ||
      type === NotificationType.SALE_COMPLETED ||
      type === NotificationType.CASH_SESSION_CLOSED
    ) {
      categoryPref = prefs.finance;
    }

    // Determine target channels by intersecting requested channels with user preferences
    const defaultChannels = [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL];
    const requestedChannels = input.channels && input.channels.length > 0 ? input.channels : defaultChannels;

    const activeChannels: NotificationChannel[] = [];
    if (requestedChannels.includes(NotificationChannel.IN_APP) && categoryPref?.inApp !== false) {
      activeChannels.push(NotificationChannel.IN_APP);
    }
    if (requestedChannels.includes(NotificationChannel.PUSH) && categoryPref?.push !== false) {
      activeChannels.push(NotificationChannel.PUSH);
    }
    if (requestedChannels.includes(NotificationChannel.EMAIL) && categoryPref?.email !== false) {
      activeChannels.push(NotificationChannel.EMAIL);
    }

    if (activeChannels.length === 0) {
      // User disabled all channels for this notification type
      return null;
    }

    // 2. Render Template
    const rendered = templateService.render(type, {
      ...data,
      title: input.title,
      message: input.message,
    });

    // 3. Create Notification Document
    const notification = await notificationRepository.createNotification({
      shopId: new mongoose.Types.ObjectId(shopId),
      recipientId: new mongoose.Types.ObjectId(recipientId),
      type,
      title: rendered.title,
      message: rendered.message,
      data,
      channels: activeChannels,
      status: NotificationStatus.PENDING,
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
    });

    // 4. Create Delivery Records & Dispatch Worker Jobs
    for (const channel of activeChannels) {
      await notificationRepository.createDeliveryRecord({
        notificationId: notification._id as mongoose.Types.ObjectId,
        channel,
        status: DeliveryStatus.PENDING,
        attempts: 0,
      });

      // Dispatch delivery processing (async job queue execution)
      setImmediate(() => {
        notificationWorker
          .processDeliveryJob({
            notificationId: (notification._id as mongoose.Types.ObjectId).toString(),
            channel,
          })
          .catch((err) => console.error('[NotificationWorker Error]', err));
      });
    }

    return notification;
  }

  async getUserNotifications(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
    filters: NotificationQueryFilters,
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    return await notificationRepository.findUserNotifications(userId, shopId, filters);
  }

  async getNotificationSummary(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<{ unreadCount: number; recent: INotification[] }> {
    const result = await notificationRepository.findUserNotifications(userId, shopId, {
      limit: 5,
    });
    return {
      unreadCount: result.unreadCount,
      recent: result.notifications,
    };
  }

  async getNotificationById(
    id: mongoose.Types.ObjectId | string,
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<INotification | null> {
    const notification = await notificationRepository.findNotificationById(id, shopId);
    if (!notification || notification.recipientId.toString() !== userId.toString()) {
      return null;
    }
    return notification;
  }

  async markAsRead(
    id: mongoose.Types.ObjectId | string,
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<INotification | null> {
    return await notificationRepository.markAsRead(id, userId, shopId);
  }

  async markAllAsRead(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<number> {
    return await notificationRepository.markAllAsRead(userId, shopId);
  }

  async registerDevice(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
    data: RegisterDeviceDto,
  ): Promise<IUserDevice> {
    return await notificationRepository.registerUserDevice({
      userId,
      shopId,
      platform: data.platform,
      pushToken: data.pushToken,
      deviceName: data.deviceName,
    });
  }

  async getUserDevices(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<IUserDevice[]> {
    return await notificationRepository.getUserDevices(userId, shopId);
  }

  async removeDevice(
    deviceId: mongoose.Types.ObjectId | string,
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<boolean> {
    return await notificationRepository.removeUserDevice(deviceId, userId, shopId);
  }
}

export const notificationService = new NotificationService();
