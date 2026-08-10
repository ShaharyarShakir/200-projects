import type { Request, Response } from 'express';
import { attendanceService, AttendanceService } from './attendance.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class AttendanceController {
  constructor(private service: AttendanceService = attendanceService) {}

  clockIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const record = await this.service.clockIn(shopId, employeeId, req.body);
    sendResponse(res, 200, record, 'Clocked in successfully');
  });

  startBreak = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const record = await this.service.startBreak(shopId, employeeId);
    sendResponse(res, 200, record, 'Break started successfully');
  });

  endBreak = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const record = await this.service.endBreak(shopId, employeeId);
    sendResponse(res, 200, record, 'Break ended successfully');
  });

  clockOut = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const record = await this.service.clockOut(shopId, employeeId, req.body);
    sendResponse(res, 200, record, 'Clocked out successfully');
  });

  getMyAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const records = await this.service.getAttendance(shopId, undefined, employeeId);
    sendResponse(res, 200, records, 'Personal attendance retrieved successfully');
  });

  getAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const date = req.query.date as string | undefined;
    const employeeId = req.query.employeeId as string | undefined;
    const records = await this.service.getAttendance(shopId, date, employeeId);
    sendResponse(res, 200, records, 'Shop attendance retrieved successfully');
  });

  updateAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const id = req.params.id as string;
    const record = await this.service.updateAttendance(id, shopId, actorId, req.body);
    sendResponse(res, 200, record, 'Attendance updated successfully');
  });
}

export const attendanceController = new AttendanceController();
