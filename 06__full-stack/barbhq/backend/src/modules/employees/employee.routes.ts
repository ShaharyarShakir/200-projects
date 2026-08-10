import { Router } from 'express';
import { employeeController } from './employee.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createEmployeeSchema, updateEmployeeSchema, toggleStatusSchema } from './employee.validator';
import { UserRole } from '../../models/user.model';

const employeeRouter = Router();

employeeRouter.use(authenticate);

employeeRouter.get('/me/dashboard', employeeController.getMyDashboard);

employeeRouter.get(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST),
  employeeController.getEmployees,
);

employeeRouter.get(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST),
  employeeController.getEmployeeById,
);

employeeRouter.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createEmployeeSchema }),
  employeeController.createEmployee,
);

employeeRouter.patch(
  '/:id/toggle-status',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: toggleStatusSchema }),
  employeeController.toggleStatus,
);

employeeRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateEmployeeSchema }),
  employeeController.updateEmployee,
);

export { employeeRouter };
