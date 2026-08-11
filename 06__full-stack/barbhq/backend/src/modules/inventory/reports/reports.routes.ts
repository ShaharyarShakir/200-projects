import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate, authorize } from '../../../middleware/auth.middleware';
import { UserRole } from '../../../models/user.model';

const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get(
  '/reports/valuation',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  reportsController.getValuationReport,
);

reportsRouter.get(
  '/reports/movements',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  reportsController.getMovementsReport,
);

reportsRouter.get(
  '/alerts',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.BARBER),
  reportsController.getInventoryAlerts,
);

export { reportsRouter };
