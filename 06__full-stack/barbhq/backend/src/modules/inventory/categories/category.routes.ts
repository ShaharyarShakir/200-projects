import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate, authorize } from '../../../middleware/auth.middleware';
import { validate } from '../../../middleware/validate.middleware';
import { createCategorySchema, updateCategorySchema } from './category.validator';
import { UserRole } from '../../../models/user.model';

const categoryRouter = Router();

categoryRouter.use(authenticate);

categoryRouter.get('/', categoryController.getCategories);
categoryRouter.get('/:id', categoryController.getCategoryById);

categoryRouter.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createCategorySchema }),
  categoryController.createCategory,
);

categoryRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateCategorySchema }),
  categoryController.updateCategory,
);

categoryRouter.delete(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  categoryController.deleteCategory,
);

export { categoryRouter };
