import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { sendResponse } from '../../utils/ApiResponse';
import { notificationService } from './notification.service';

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const filters = req.query as any;

      const result = await notificationService.getUserNotifications(userId, shopId, filters);

      sendResponse(
        res,
        200,
        {
          notifications: result.notifications.map((n) => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            data: n.data,
            channels: n.channels,
            status: n.status,
            readAt: n.readAt,
            createdAt: n.createdAt,
          })),
          total: result.total,
          unreadCount: result.unreadCount,
        },
        'Notifications retrieved successfully',
      );
    } catch (error: any) {
      sendResponse(res, 500, null, error.message || 'Failed to fetch notifications');
    }
  }

  async getSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const summary = await notificationService.getNotificationSummary(userId, shopId);

      sendResponse(
        res,
        200,
        {
          unread: summary.unreadCount,
          recent: summary.recent.map((n) => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            readAt: n.readAt,
            createdAt: n.createdAt,
          })),
        },
        'Notification summary retrieved successfully',
      );
    } catch (error: any) {
      sendResponse(res, 500, null, error.message || 'Failed to fetch notification summary');
    }
  }

  async getNotificationById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const notification = await notificationService.getNotificationById(req.params.id, userId, shopId);

      if (!notification) {
        sendResponse(res, 404, null, 'Notification not found');
        return;
      }

      sendResponse(
        res,
        200,
        {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          channels: notification.channels,
          status: notification.status,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        },
        'Notification retrieved successfully',
      );
    } catch (error: any) {
      sendResponse(res, 500, null, error.message || 'Failed to fetch notification');
    }
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const updated = await notificationService.markAsRead(req.params.id, userId, shopId);

      if (!updated) {
        sendResponse(res, 404, null, 'Notification not found or not authorized');
        return;
      }

      sendResponse(
        res,
        200,
        {
          id: updated._id,
          readAt: updated.readAt,
        },
        'Notification marked as read',
      );
    } catch (error: any) {
      sendResponse(res, 500, null, error.message || 'Failed to mark notification as read');
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const count = await notificationService.markAllAsRead(userId, shopId);

      sendResponse(res, 200, { markedCount: count }, 'All notifications marked as read');
    } catch (error: any) {
      sendResponse(res, 500, null, error.message || 'Failed to mark all notifications as read');
    }
  }

  async registerDevice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const device = await notificationService.registerDevice(userId, shopId, req.body);

      sendResponse(
        res,
        201,
        {
          id: device._id,
          platform: device.platform,
          pushToken: device.pushToken,
          deviceName: device.deviceName,
          isActive: device.isActive,
        },
        'Device registered successfully',
      );
    } catch (error: any) {
      sendResponse(res, 400, null, error.message || 'Failed to register device');
    }
  }

  async getDevices(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const devices = await notificationService.getUserDevices(userId, shopId);

      sendResponse(
        res,
        200,
        devices.map((d) => ({
          id: d._id,
          platform: d.platform,
          pushToken: d.pushToken,
          deviceName: d.deviceName,
          isActive: d.isActive,
          lastUsedAt: d.lastUsedAt,
        })),
        'User devices retrieved successfully',
      );
    } catch (error: any) {
      sendResponse(res, 500, null, error.message || 'Failed to fetch user devices');
    }
  }

  async removeDevice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const success = await notificationService.removeDevice(req.params.id, userId, shopId);

      if (!success) {
        sendResponse(res, 404, null, 'Device token not found');
        return;
      }

      sendResponse(res, 200, { id: req.params.id }, 'Device unregistered successfully');
    } catch (error: any) {
      sendResponse(res, 500, null, error.message || 'Failed to remove device');
    }
  }
}

export const notificationController = new NotificationController();
