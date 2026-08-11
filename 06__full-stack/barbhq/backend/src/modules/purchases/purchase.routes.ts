import { Router } from 'express';
import { purchaseController } from './purchase.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  receivePurchaseSchema,
} from './purchase.validator';
import { UserRole } from '../../models/user.model';

const purchaseRouter = Router();

purchaseRouter.use(authenticate);
purchaseRouter.use(authorize(UserRole.OWNER, UserRole.MANAGER));

purchaseRouter.get('/', purchaseController.getPurchaseOrders);
purchaseRouter.get('/:id', purchaseController.getPurchaseOrderById);

purchaseRouter.post(
  '/',
  validate({ body: createPurchaseOrderSchema }),
  purchaseController.createPurchaseOrder,
);

purchaseRouter.patch(
  '/:id',
  validate({ body: updatePurchaseOrderSchema }),
  purchaseController.updatePurchaseOrder,
);

purchaseRouter.post(
  '/:id/receive',
  validate({ body: receivePurchaseSchema }),
  purchaseController.receivePurchaseOrder,
);

purchaseRouter.post('/:id/cancel', purchaseController.cancelPurchaseOrder);

export { purchaseRouter };
