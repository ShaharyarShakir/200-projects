import { Router } from 'express';
import { branchController } from './branch.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createBranchSchema, updateBranchSchema } from './branch.validator';
import { UserRole } from '../../models/user.model';

const branchRouter = Router();

branchRouter.use(authenticate);

branchRouter.get('/', branchController.getBranches);
branchRouter.get('/:id', branchController.getBranchById);

branchRouter.post(
  '/',
  authorize(UserRole.OWNER),
  validate({ body: createBranchSchema }),
  branchController.createBranch,
);

branchRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateBranchSchema }),
  branchController.updateBranch,
);

branchRouter.delete(
  '/:id',
  authorize(UserRole.OWNER),
  branchController.deleteBranch,
);

export { branchRouter };
