import { Router } from 'express';
import { getUsers, getUser } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { userIdParamSchema } from './user.validator';

export const userRouter = Router();

// Apply auth middleware to all user endpoints
userRouter.use(authenticate);

userRouter.get('/users', getUsers);
userRouter.get('/users/:id', validate(userIdParamSchema), getUser);
