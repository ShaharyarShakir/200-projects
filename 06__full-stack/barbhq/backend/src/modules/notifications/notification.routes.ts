import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { notificationController } from './notification.controller';
import { preferenceController } from './preferences/preference.controller';
import {
  registerDeviceSchema,
  updatePreferencesSchema,
  getNotificationsQuerySchema,
} from './notification.validator';

const notificationRouter = Router();

// Protect all notification routes
notificationRouter.use(authenticate);

// Device management routes
notificationRouter.post(
  '/devices',
  validate({ body: registerDeviceSchema }),
  notificationController.registerDevice,
);
notificationRouter.get('/devices', notificationController.getDevices);
notificationRouter.delete('/devices/:id', notificationController.removeDevice);

// Notification preference routes
notificationRouter.get('/preferences', preferenceController.getPreferences);
notificationRouter.patch(
  '/preferences',
  validate({ body: updatePreferencesSchema }),
  preferenceController.updatePreferences,
);

// User notification routes
notificationRouter.get(
  '/',
  validate({ query: getNotificationsQuerySchema }),
  notificationController.getNotifications,
);
notificationRouter.get('/summary', notificationController.getSummary);
notificationRouter.get('/:id', notificationController.getNotificationById);
notificationRouter.patch('/:id/read', notificationController.markAsRead);
notificationRouter.patch('/read-all', notificationController.markAllAsRead);

export { notificationRouter };
