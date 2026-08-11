import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware';
import { sendResponse } from '../../../utils/ApiResponse';
import { preferenceService } from './preference.service';

export class PreferenceController {
  async getPreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const preferences = await preferenceService.getPreferences(userId, shopId);
      sendResponse(res, 200, preferences.preferences, 'Notification preferences retrieved successfully');
    } catch (error: any) {
      sendResponse(res, 500, null, error.message || 'Failed to retrieve notification preferences');
    }
  }

  async updatePreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shopId = req.user!.shopId;
      const preferences = await preferenceService.updatePreferences(userId, shopId, req.body);
      sendResponse(res, 200, preferences.preferences, 'Notification preferences updated successfully');
    } catch (error: any) {
      sendResponse(res, 400, null, error.message || 'Failed to update notification preferences');
    }
  }
}

export const preferenceController = new PreferenceController();
