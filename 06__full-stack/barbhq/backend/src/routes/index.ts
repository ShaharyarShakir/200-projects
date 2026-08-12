import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { shopRouter } from '../modules/shop/shop.routes';
import { shopSettingsRouter } from '../modules/shop-settings/shop-settings.routes';
import { businessHoursRouter } from '../modules/business-hours/business-hours.routes';
import { holidayRouter } from '../modules/holidays/holiday.routes';
import { branchRouter } from '../modules/branch/branch.routes';
import { employeeRouter } from '../modules/employees/employee.routes';
import { shiftRouter } from '../modules/shifts/shift.routes';
import { attendanceRouter } from '../modules/attendance/attendance.routes';
import { leaveRouter } from '../modules/leaves/leave.routes';
import { auditLogRouter } from '../modules/audit-logs/audit-log.routes';
import { shopDashboardRouter } from '../modules/shop-dashboard/shop-dashboard.routes';
import { userRouter } from '../modules/user/user.routes';
import { compensationRouter } from '../modules/compensation/compensation.routes';
import { payrollRouter } from '../modules/payroll/payroll.routes';
import { inventoryRouter } from '../modules/inventory/inventory.routes';
import { purchaseRouter } from '../modules/purchases/purchase.routes';
import { vendorRouter } from '../modules/inventory/vendors/vendor.routes';
import { notificationRouter } from '../modules/notifications/notification.routes';

const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/shop/settings', shopSettingsRouter);
apiRouter.use('/shop/business-hours', businessHoursRouter);
apiRouter.use('/shop/holidays', holidayRouter);
apiRouter.use('/dashboard', shopDashboardRouter);
apiRouter.use('/shop/dashboard', shopDashboardRouter);
apiRouter.use('/shop', shopRouter);
apiRouter.use('/shops', shopRouter); // Alias
apiRouter.use('/branches', branchRouter);
apiRouter.use('/employees', compensationRouter);
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/shifts', shiftRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/leaves', leaveRouter);
apiRouter.use('/payroll', payrollRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/purchases', purchaseRouter);
apiRouter.use('/vendors', vendorRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/audit-logs', auditLogRouter);
apiRouter.use('/users', userRouter);

export default apiRouter;
