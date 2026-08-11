import {
  NotificationChannel,
  NotificationStatus,
} from '../../../models/notification.model';
import { DeliveryStatus } from '../../../models/notification-delivery.model';
import { notificationRepository } from '../notification.repository';
import { emailChannel } from '../channels/email.channel';
import { pushChannel } from '../channels/push.channel';
import { inAppChannel } from '../channels/in-app.channel';
import { User } from '../../../models/user.model';
import type { DeliveryJobPayload } from '../notification.types';

export class NotificationWorker {
  private maxAttempts = 3;
  private backoffDelaysMs = [10000, 30000, 120000]; // 10s, 30s, 2m

  async processDeliveryJob(payload: DeliveryJobPayload): Promise<void> {
    const { notificationId, channel } = payload;

    // Idempotency / Delivery record lookup
    let delivery = await notificationRepository.findDeliveryRecord(notificationId, channel);
    if (!delivery) {
      // Create PENDING delivery if not existing
      try {
        delivery = await notificationRepository.createDeliveryRecord({
          notificationId: notificationId as any,
          channel,
          status: DeliveryStatus.PENDING,
          attempts: 0,
        });
      } catch (err: any) {
        // If duplicate key race condition occurs, fetch existing
        delivery = await notificationRepository.findDeliveryRecord(notificationId, channel);
      }
    }

    if (!delivery || delivery.status === DeliveryStatus.SENT) {
      // Already sent or duplicate job - ignore for idempotency
      return;
    }

    const notification = await notificationRepository.findNotificationById(
      notificationId,
      (delivery as any).shopId || undefined,
    );
    if (!notification) {
      await notificationRepository.updateDeliveryRecord(delivery._id, {
        status: DeliveryStatus.FAILED,
        error: 'Notification document not found',
      });
      return;
    }

    const currentAttempt = delivery.attempts + 1;
    await notificationRepository.updateDeliveryRecord(delivery._id, {
      status: DeliveryStatus.PROCESSING,
      attempts: currentAttempt,
      lastAttemptAt: new Date(),
    });

    try {
      if (channel === NotificationChannel.IN_APP) {
        await inAppChannel.send({
          notificationId,
          recipientId: notification.recipientId.toString(),
          title: notification.title,
          message: notification.message,
          data: notification.data,
        });
        await notificationRepository.updateDeliveryRecord(delivery._id, {
          status: DeliveryStatus.SENT,
          deliveredAt: new Date(),
          provider: 'IN_APP_SYSTEM',
        });
      } else if (channel === NotificationChannel.EMAIL) {
        const user = await User.findById(notification.recipientId);
        if (!user || !user.email) {
          throw new Error('Recipient email not found');
        }
        await emailChannel.send({
          to: user.email,
          subject: notification.title,
          html: `<p>${notification.message}</p>`,
        });
        await notificationRepository.updateDeliveryRecord(delivery._id, {
          status: DeliveryStatus.SENT,
          deliveredAt: new Date(),
          provider: 'DEVELOPMENT_EMAIL',
          providerMessageId: `email_${Date.now()}_${notificationId}`,
        });
      } else if (channel === NotificationChannel.PUSH) {
        const devices = await notificationRepository.getUserDevices(
          notification.recipientId,
          notification.shopId,
        );
        const tokens = devices.map((d) => d.pushToken);
        if (tokens.length > 0) {
          await pushChannel.send({
            tokens,
            title: notification.title,
            body: notification.message,
            data: notification.data,
          });
        }
        await notificationRepository.updateDeliveryRecord(delivery._id, {
          status: DeliveryStatus.SENT,
          deliveredAt: new Date(),
          provider: 'DEVELOPMENT_PUSH',
          providerMessageId: `push_${Date.now()}_${notificationId}`,
        });
      }

      await this.evaluateNotificationStatus(notificationId);
    } catch (error: any) {
      const errorMsg = error.message || 'Delivery error';
      if (currentAttempt < this.maxAttempts) {
        // Schedule retry (exponential backoff)
        const delay = this.backoffDelaysMs[currentAttempt - 1] || 60000;
        await notificationRepository.updateDeliveryRecord(delivery._id, {
          status: DeliveryStatus.PENDING,
          error: `Attempt ${currentAttempt} failed: ${errorMsg}. Retrying in ${delay / 1000}s`,
        });
      } else {
        await notificationRepository.updateDeliveryRecord(delivery._id, {
          status: DeliveryStatus.FAILED,
          error: `Permanent failure after ${currentAttempt} attempts: ${errorMsg}`,
        });
        await this.evaluateNotificationStatus(notificationId);
      }
    }
  }

  private async evaluateNotificationStatus(notificationId: string): Promise<void> {
    const notification = await notificationRepository.findNotificationById(notificationId, undefined as any);
    if (!notification) return;

    const deliveries = await Promise.all(
      notification.channels.map((ch) => notificationRepository.findDeliveryRecord(notificationId, ch)),
    );

    const validDeliveries = deliveries.filter(Boolean);
    const sentCount = validDeliveries.filter((d) => d?.status === DeliveryStatus.SENT).length;
    const failedCount = validDeliveries.filter((d) => d?.status === DeliveryStatus.FAILED).length;
    const totalChannels = notification.channels.length;

    if (sentCount === totalChannels) {
      await notificationRepository.updateNotificationStatus(
        notificationId,
        NotificationStatus.SENT,
        new Date(),
      );
    } else if (sentCount > 0) {
      await notificationRepository.updateNotificationStatus(
        notificationId,
        NotificationStatus.PARTIALLY_SENT,
        new Date(),
      );
    } else if (failedCount === totalChannels) {
      await notificationRepository.updateNotificationStatus(
        notificationId,
        NotificationStatus.FAILED,
      );
    }
  }
}

export const notificationWorker = new NotificationWorker();
