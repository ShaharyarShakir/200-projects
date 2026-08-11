import { Router } from 'express';
import { shiftController } from './shift.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createShiftSchema, updateShiftSchema, createShiftExceptionSchema } from './shift.validator';
import { UserRole } from '../../models/user.model';

const shiftRouter = Router();

shiftRouter.use(authenticate);

shiftRouter.get('/exceptions', shiftController.getExceptions);
shiftRouter.post(
  '/exceptions',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createShiftExceptionSchema }),
  shiftController.createException,
);

shiftRouter.get('/', shiftController.getShifts);
shiftRouter.get('/:id', shiftController.getShiftById);

shiftRouter.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createShiftSchema }),
  shiftController.createShift,
);

shiftRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateShiftSchema }),
  shiftController.updateShift,
);

shiftRouter.delete(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  shiftController.deleteShift,
);

export { shiftRouter };
