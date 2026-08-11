import { z } from 'zod';
import { DevicePlatform } from '../../models/user-device.model';
import { NotificationType, NotificationStatus } from '../../models/notification.model';

export const registerDeviceSchema = z.object({
  platform: z.nativeEnum(DevicePlatform),
  pushToken: z.string().min(1, 'Push token is required'),
  deviceName: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  employeeLate: z.object({ inApp: z.boolean(), push: z.boolean(), email: z.boolean() }).partial().optional(),
  leaveRequests: z.object({ inApp: z.boolean(), push: z.boolean(), email: z.boolean() }).partial().optional(),
  payroll: z.object({ inApp: z.boolean(), push: z.boolean(), email: z.boolean() }).partial().optional(),
  inventory: z.object({ inApp: z.boolean(), push: z.boolean(), email: z.boolean() }).partial().optional(),
  finance: z.object({ inApp: z.boolean(), push: z.boolean(), email: z.boolean() }).partial().optional(),
});

export const getNotificationsQuerySchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
  type: z.nativeEnum(NotificationType).optional(),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});
