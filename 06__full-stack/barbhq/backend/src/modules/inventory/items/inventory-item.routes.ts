import { Router } from 'express';
import { inventoryItemController } from './inventory-item.controller';
import { authenticate, authorize } from '../../../middleware/auth.middleware';
import { validate } from '../../../middleware/validate.middleware';
import {
  createItemSchema,
  updateItemSchema,
  adjustStockSchema,
  consumptionSchema,
} from './inventory-item.validator';
import { UserRole } from '../../../models/user.model';

const inventoryItemRouter = Router();

inventoryItemRouter.use(authenticate);

inventoryItemRouter.get('/items', inventoryItemController.getItems);
inventoryItemRouter.get('/items/:id', inventoryItemController.getItemById);
inventoryItemRouter.get('/items/:id/movements', inventoryItemController.getItemMovements);

inventoryItemRouter.post(
  '/items',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createItemSchema }),
  inventoryItemController.createItem,
);

inventoryItemRouter.patch(
  '/items/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateItemSchema }),
  inventoryItemController.updateItem,
);

inventoryItemRouter.post(
  '/items/:id/adjust',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: adjustStockSchema }),
  inventoryItemController.adjustStock,
);

inventoryItemRouter.post(
  '/consumption',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.BARBER),
  validate({ body: consumptionSchema }),
  inventoryItemController.recordConsumption,
);

inventoryItemRouter.delete(
  '/items/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  inventoryItemController.deleteItem,
);

export { inventoryItemRouter };
