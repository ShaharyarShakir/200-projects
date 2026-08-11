import { Router } from 'express';
import { shopController } from './shop.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateShopSchema } from './shop.validator';
import { UserRole } from '../../models/user.model';

const shopRouter = Router();

shopRouter.use(authenticate);

shopRouter.get('/', shopController.getCurrentShop);
shopRouter.patch(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateShopSchema }),
  shopController.updateCurrentShop,
);

export { shopRouter };
