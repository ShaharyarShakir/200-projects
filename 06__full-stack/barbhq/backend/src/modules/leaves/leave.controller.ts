import type { Request, Response } from 'express';
import { leaveService, LeaveService } from './leave.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import type { LeaveStatus } from '../../models/leave.model';

export class LeaveController {
  constructor(private service: LeaveService = leaveService) {}

  createLeaveRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const leave = await this.service.createLeaveRequest(shopId, employeeId, req.body);
    sendResponse(res, 201, leave, 'Leave request submitted successfully');
  });

  getMyLeaves = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const leaves = await this.service.getMyLeaveRequests(shopId, employeeId);
    sendResponse(res, 200, leaves, 'Personal leave requests retrieved successfully');
  });

  cancelMyLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const id = req.params.id as string;
    await this.service.cancelMyLeaveRequest(id, shopId, employeeId);
    sendResponse(res, 200, null, 'Leave request cancelled successfully');
  });

  getShopLeaves = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const status = req.query.status as LeaveStatus | undefined;
    const leaves = await this.service.getShopLeaveRequests(shopId, status);
    sendResponse(res, 200, leaves, 'Shop leave requests retrieved successfully');
  });

  getLeaveById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const id = req.params.id as string;
    const leave = await this.service.getLeaveRequestById(id, shopId);
    sendResponse(res, 200, leave, 'Leave request retrieved successfully');
  });

  approveLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const reviewerId = req.user!.id;
    const id = req.params.id as string;
    const leave = await this.service.approveLeaveRequest(id, shopId, reviewerId);
    sendResponse(res, 200, leave, 'Leave request approved successfully');
  });

  rejectLeave = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const reviewerId = req.user!.id;
    const id = req.params.id as string;
    const reason = req.body.reason;
    const leave = await this.service.rejectLeaveRequest(id, shopId, reviewerId, reason);
    sendResponse(res, 200, leave, 'Leave request rejected successfully');
  });
}

export const leaveController = new LeaveController();
