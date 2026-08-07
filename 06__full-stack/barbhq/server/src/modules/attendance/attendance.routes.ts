import { Router } from 'express';
import { clockIn, clockOut, getHistory, getEmployeeHistory } from './attendance.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { validate } from '../../middleware/validate.middleware';
import { UserRole } from '../user/user.types';
import { clockInSchema, clockOutSchema, getHistorySchema } from './attendance.validator';

export const attendanceRouter = Router();

// Apply base authentication to all attendance routes
attendanceRouter.use(authenticate);

attendanceRouter.post('/attendance/clock-in', validate(clockInSchema), clockIn);
attendanceRouter.post('/attendance/clock-out', validate(clockOutSchema), clockOut);

// Only Owner/Manager can see global history list
attendanceRouter.get(
  '/attendance',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate(getHistorySchema),
  getHistory,
);

attendanceRouter.get('/attendance/:employeeId', getEmployeeHistory);
