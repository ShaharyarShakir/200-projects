import type { Request, Response } from 'express';
import { AttendanceService } from './attendance.service';
import { EmployeeService } from '../employee/employee.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

const attendanceService = new AttendanceService();
const employeeService = new EmployeeService();

const verifyEmployeeAccess = async (req: Request, employeeId: string) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const isPrivileged = req.user.role === 'OWNER' || req.user.role === 'MANAGER';
  if (isPrivileged) return;

  const employee = await employeeService.getEmployeeByEmail(req.user.email, req.user.shopId);
  if (!employee || employee._id.toString() !== employeeId) {
    throw new ApiError(403, 'Forbidden - You can only manage your own attendance sessions');
  }
};

export const clockIn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { employeeId, notes } = req.body;
  await verifyEmployeeAccess(req, employeeId);

  const attendance = await attendanceService.clockIn(req.user.shopId, employeeId, notes);
  sendResponse(res, 201, attendance, 'Clocked in successfully');
});

export const clockOut = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { employeeId, notes } = req.body;
  await verifyEmployeeAccess(req, employeeId);

  const attendance = await attendanceService.clockOut(req.user.shopId, employeeId, notes);
  sendResponse(res, 200, attendance, 'Clocked out successfully');
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Only OWNER/MANAGER can view global shop attendance history
  const isPrivileged = req.user.role === 'OWNER' || req.user.role === 'MANAGER';
  if (!isPrivileged) {
    throw new ApiError(403, 'Forbidden - Insufficient permissions');
  }

  const filters = {
    employeeId: req.query.employeeId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  };

  const history = await attendanceService.getHistory(req.user.shopId, filters);
  sendResponse(res, 200, history, 'Attendance history retrieved successfully');
});

export const getEmployeeHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const employeeId = req.params.employeeId as string;
  await verifyEmployeeAccess(req, employeeId);

  const filters = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  };

  const history = await attendanceService.getEmployeeHistory(req.user.shopId, employeeId, filters);
  sendResponse(res, 200, history, 'Employee attendance history retrieved successfully');
});
