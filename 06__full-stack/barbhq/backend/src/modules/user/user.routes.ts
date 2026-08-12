import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateUserSchema } from './user.validator';
import { UserRole } from '../../models/user.model';

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get('/', authorize(UserRole.OWNER, UserRole.MANAGER), userController.getUsers);
userRouter.get('/:id', userController.getUserById);
userRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateUserSchema }),
  userController.updateUser,
);

export { userRouter };
