import mongoose from 'mongoose';
import {
  NotificationPreference,
  type INotificationPreference,
  type INotificationPreferencesMap,
} from '../../../models/notification-preference.model';

import type { UpdateNotificationPreferencesDto } from './preference.types';

export class PreferenceService {
  private getDefaultPreferences(): INotificationPreferencesMap {
    return {
      employeeLate: { inApp: true, push: true, email: true },
      leaveRequests: { inApp: true, push: true, email: true },
      payroll: { inApp: true, push: true, email: true },
      inventory: { inApp: true, push: true, email: true },
      finance: { inApp: true, push: true, email: true },
    };
  }

  async getPreferences(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
  ): Promise<INotificationPreference> {
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const shopIdObj = typeof shopId === 'string' ? new mongoose.Types.ObjectId(shopId) : shopId;

    let preference = await NotificationPreference.findOne({ userId: userIdObj, shopId: shopIdObj });
    if (!preference) {
      preference = await NotificationPreference.create({
        userId: userIdObj,
        shopId: shopIdObj,
        preferences: this.getDefaultPreferences(),
      });
    }
    return preference;
  }

  async updatePreferences(
    userId: mongoose.Types.ObjectId | string,
    shopId: mongoose.Types.ObjectId | string,
    updateData: UpdateNotificationPreferencesDto,
  ): Promise<INotificationPreference> {
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const shopIdObj = typeof shopId === 'string' ? new mongoose.Types.ObjectId(shopId) : shopId;

    let preference = await NotificationPreference.findOne({ userId: userIdObj, shopId: shopIdObj });

    if (!preference) {
      const merged = {
        ...this.getDefaultPreferences(),
        ...updateData,
      };
      preference = await NotificationPreference.create({
        userId: userIdObj,
        shopId: shopIdObj,
        preferences: merged,
      });

    } else {
      if (updateData.employeeLate) {
        preference.preferences.employeeLate = { ...preference.preferences.employeeLate, ...updateData.employeeLate };
      }
      if (updateData.leaveRequests) {
        preference.preferences.leaveRequests = { ...preference.preferences.leaveRequests, ...updateData.leaveRequests };
      }
      if (updateData.payroll) {
        preference.preferences.payroll = { ...preference.preferences.payroll, ...updateData.payroll };
      }
      if (updateData.inventory) {
        preference.preferences.inventory = { ...preference.preferences.inventory, ...updateData.inventory };
      }
      if (updateData.finance) {
        preference.preferences.finance = { ...preference.preferences.finance, ...updateData.finance };
      }
      preference.markModified('preferences');
      await preference.save();
    }

    return preference;
  }
}

export const preferenceService = new PreferenceService();
