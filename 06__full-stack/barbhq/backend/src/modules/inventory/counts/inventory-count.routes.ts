import { Router } from 'express';
import { inventoryCountController } from './inventory-count.controller';
import { authenticate, authorize } from '../../../middleware/auth.middleware';
import { validate } from '../../../middleware/validate.middleware';
import { startCountSchema, submitCountItemsSchema } from './inventory-count.validator';
import { UserRole } from '../../../models/user.model';

const inventoryCountRouter = Router();

inventoryCountRouter.use(authenticate);
inventoryCountRouter.use(authorize(UserRole.OWNER, UserRole.MANAGER));

inventoryCountRouter.get('/', inventoryCountController.getInventoryCounts);
inventoryCountRouter.get('/:id', inventoryCountController.getInventoryCountById);

inventoryCountRouter.post(
  '/',
  validate({ body: startCountSchema }),
  inventoryCountController.startInventoryCount,
);

inventoryCountRouter.patch(
  '/:id/items',
  validate({ body: submitCountItemsSchema }),
  inventoryCountController.recordCountItems,
);

inventoryCountRouter.post('/:id/complete', inventoryCountController.completeInventoryCount);

export { inventoryCountRouter };
