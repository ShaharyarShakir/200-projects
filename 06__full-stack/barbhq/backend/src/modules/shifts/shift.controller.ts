import type { Request, Response } from 'express';
import { shiftService, ShiftService } from './shift.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class ShiftController {
  constructor(private service: ShiftService = shiftService) {}

  getShifts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.query.employeeId as string | undefined;
    const shifts = await this.service.getShifts(shopId, employeeId);
    sendResponse(res, 200, shifts, 'Shifts retrieved successfully');
  });

  getShiftById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const id = req.params.id as string;
    const shift = await this.service.getShiftById(id, shopId);
    sendResponse(res, 200, shift, 'Shift details retrieved successfully');
  });

  createShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const shift = await this.service.createShift(shopId, actorId, req.body);
    sendResponse(res, 201, shift, 'Shift created successfully');
  });

  updateShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const id = req.params.id as string;
    const shift = await this.service.updateShift(id, shopId, actorId, req.body);
    sendResponse(res, 200, shift, 'Shift updated successfully');
  });

  deleteShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const id = req.params.id as string;
    await this.service.deleteShift(id, shopId, actorId);
    sendResponse(res, 200, null, 'Shift deleted successfully');
  });

  // Shift Exceptions
  createException = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const exception = await this.service.createException(shopId, actorId, req.body);
    sendResponse(res, 201, exception, 'Shift exception created successfully');
  });

  getExceptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.query.employeeId as string | undefined;
    const date = req.query.date as string | undefined;
    const exceptions = await this.service.getExceptions(shopId, employeeId, date);
    sendResponse(res, 200, exceptions, 'Shift exceptions retrieved successfully');
  });
}

export const shiftController = new ShiftController();
