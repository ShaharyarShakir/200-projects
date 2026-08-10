import { Router } from 'express';
import { compensationController } from './compensation.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createCompensationSchema, updateCompensationSchema } from './compensation.validator';
import { UserRole } from '../../models/user.model';

const compensationRouter = Router({ mergeParams: true });

compensationRouter.use(authenticate);

compensationRouter.get(
  '/:employeeId/compensation',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  compensationController.getActiveCompensation,
);
compensationRouter.get(
  '/:employeeId/compensation/history',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  compensationController.getCompensationHistory,
);
compensationRouter.post(
  '/:employeeId/compensation',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createCompensationSchema }),
  compensationController.setCompensation,
);
compensationRouter.patch(
  '/:employeeId/compensation/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateCompensationSchema }),
  compensationController.updateCompensation,
);

export { compensationRouter };
