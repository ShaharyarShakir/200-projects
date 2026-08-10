import { Router } from 'express';
import { businessHoursController } from './business-hours.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateBusinessHoursSchema } from './business-hours.validator';
import { UserRole } from '../../models/user.model';

const businessHoursRouter = Router();

businessHoursRouter.use(authenticate);

businessHoursRouter.get('/', businessHoursController.getHours);
businessHoursRouter.patch(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateBusinessHoursSchema }),
  businessHoursController.updateHours,
);

export { businessHoursRouter };
