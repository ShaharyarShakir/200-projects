import { Router } from 'express';
import { payrollController } from './payroll.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createPayrollPeriodSchema, createPayrollAdjustmentSchema, payrollPeriodQuerySchema } from './payroll.validator';
import { UserRole } from '../../models/user.model';

const payrollRouter = Router();

payrollRouter.use(authenticate);

// Employee Paystubs
payrollRouter.get('/me', payrollController.getMyPaystubs);

// Payroll Dashboard
payrollRouter.get(
  '/dashboard',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  payrollController.getDashboard,
);

// Periods Endpoints
payrollRouter.get(
  '/periods',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ query: payrollPeriodQuerySchema }),
  payrollController.getPeriods,
);

payrollRouter.get(
  '/periods/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  payrollController.getPeriodById,
);

payrollRouter.post(
  '/periods',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createPayrollPeriodSchema }),
  payrollController.createPeriod,
);

payrollRouter.post(
  '/periods/:id/process',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  payrollController.processPeriod,
);

payrollRouter.post(
  '/periods/:id/finalize',
  authorize(UserRole.OWNER),
  payrollController.finalizePeriod,
);

payrollRouter.post(
  '/periods/:id/mark-paid',
  authorize(UserRole.OWNER),
  payrollController.markPaid,
);

// Records Endpoints
payrollRouter.get(
  '/periods/:periodId/employees',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  payrollController.getPeriodRecords,
);

payrollRouter.get(
  '/periods/:periodId/employees/:employeeId',
  payrollController.getEmployeeRecord,
);

// Adjustments Endpoints
payrollRouter.post(
  '/records/:id/adjustments',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: createPayrollAdjustmentSchema }),
  payrollController.addAdjustment,
);

payrollRouter.get(
  '/records/:id/adjustments',
  payrollController.getAdjustments,
);

payrollRouter.delete(
  '/adjustments/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  payrollController.deleteAdjustment,
);

export { payrollRouter };
