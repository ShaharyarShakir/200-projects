import { Router } from 'express';
import { vendorController } from './vendor.controller';
import { authenticate, authorize } from '../../../middleware/auth.middleware';
import { validate } from '../../../middleware/validate.middleware';
import { createVendorSchema, updateVendorSchema } from './vendor.validator';
import { UserRole } from '../../../models/user.model';

const vendorRouter = Router();

vendorRouter.use(authenticate);

vendorRouter.get('/', vendorController.getVendors);
vendorRouter.get('/:id', vendorController.getVendorById);

vendorRouter.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createVendorSchema }),
  vendorController.createVendor,
);

vendorRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateVendorSchema }),
  vendorController.updateVendor,
);

vendorRouter.delete(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  vendorController.deleteVendor,
);

export { vendorRouter };
