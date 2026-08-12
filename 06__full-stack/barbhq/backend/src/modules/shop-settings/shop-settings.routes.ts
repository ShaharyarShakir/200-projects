import { Router } from 'express';
import { shopSettingsController } from './shop-settings.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateShopSettingsSchema } from './shop-settings.validator';
import { UserRole } from '../../models/user.model';

const shopSettingsRouter = Router();

shopSettingsRouter.use(authenticate);

shopSettingsRouter.get('/', shopSettingsController.getSettings);
shopSettingsRouter.patch(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateShopSettingsSchema }),
  shopSettingsController.updateSettings,
);

export { shopSettingsRouter };
