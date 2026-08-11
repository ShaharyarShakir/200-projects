import { Router } from 'express';
import { holidayController } from './holiday.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createHolidaySchema, updateHolidaySchema } from './holiday.validator';
import { UserRole } from '../../models/user.model';

const holidayRouter = Router();

holidayRouter.use(authenticate);

holidayRouter.get('/', holidayController.getHolidays);
holidayRouter.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createHolidaySchema }),
  holidayController.createHoliday,
);
holidayRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateHolidaySchema }),
  holidayController.updateHoliday,
);
holidayRouter.delete(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  holidayController.deleteHoliday,
);

export { holidayRouter };
