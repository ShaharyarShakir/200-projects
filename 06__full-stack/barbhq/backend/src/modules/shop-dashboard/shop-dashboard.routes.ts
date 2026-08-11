import { Router } from 'express';
import { shopDashboardController } from './shop-dashboard.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../models/user.model';

const shopDashboardRouter = Router();

shopDashboardRouter.use(authenticate);
shopDashboardRouter.use(authorize(UserRole.OWNER, UserRole.MANAGER));

shopDashboardRouter.get('/', shopDashboardController.getDashboardOverview);
shopDashboardRouter.get('/overview', shopDashboardController.getDashboardOverview);
shopDashboardRouter.get('/workforce', shopDashboardController.getWorkforceDashboard);

export { shopDashboardRouter };
