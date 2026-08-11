import { Router } from 'express';
import { leaveController } from './leave.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createLeaveRequestSchema, reviewLeaveRequestSchema } from './leave.validator';
import { UserRole } from '../../models/user.model';

const leaveRouter = Router();

leaveRouter.use(authenticate);

leaveRouter.post('/', validate({ body: createLeaveRequestSchema }), leaveController.createLeaveRequest);
leaveRouter.get('/me', leaveController.getMyLeaves);
leaveRouter.delete('/:id', leaveController.cancelMyLeave);

leaveRouter.get(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  leaveController.getShopLeaves,
);

leaveRouter.get(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  leaveController.getLeaveById,
);

leaveRouter.patch(
  '/:id/approve',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  leaveController.approveLeave,
);

leaveRouter.patch(
  '/:id/reject',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: reviewLeaveRequestSchema }),
  leaveController.rejectLeave,
);

export { leaveRouter };
