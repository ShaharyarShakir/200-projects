import { Router } from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './employee.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validate } from '../../middleware/validate.middleware';
import { UserRole } from '../user/user.types';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
} from './employee.validator';

export const employeeRouter = Router();

// Apply base authentication to all employee routes
employeeRouter.use(authenticate);

employeeRouter.get('/employees', getEmployees);
employeeRouter.get('/employees/:id', validate(employeeIdParamSchema), getEmployee);

// Owner/Manager only write actions
employeeRouter.post(
  '/employees',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate(createEmployeeSchema),
  createEmployee,
);

employeeRouter.patch(
  '/employees/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate(employeeIdParamSchema),
  validate(updateEmployeeSchema),
  updateEmployee,
);

employeeRouter.delete(
  '/employees/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate(employeeIdParamSchema),
  deleteEmployee,
);
