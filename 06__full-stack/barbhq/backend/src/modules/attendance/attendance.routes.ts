import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { clockInSchema, clockOutSchema, updateAttendanceSchema } from './attendance.validator';
import { UserRole } from '../../models/user.model';

const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.post('/clock-in', validate({ body: clockInSchema }), attendanceController.clockIn);
attendanceRouter.post('/clock-out', validate({ body: clockOutSchema }), attendanceController.clockOut);
attendanceRouter.post('/break/start', attendanceController.startBreak);
attendanceRouter.post('/break/end', attendanceController.endBreak);
attendanceRouter.get('/me', attendanceController.getMyAttendance);

attendanceRouter.get(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST),
  attendanceController.getAttendance,
);

attendanceRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate({ body: updateAttendanceSchema }),
  attendanceController.updateAttendance,
);

export { attendanceRouter };
