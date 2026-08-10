import type { Request, Response, NextFunction } from 'express';
import { compensationService, CompensationService } from './compensation.service';
import { sendResponse } from '../../utils/ApiResponse';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class CompensationController {
  constructor(private service: CompensationService = compensationService) {}

  getActiveCompensation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { employeeId } = req.params;
      const compensation = await this.service.getActiveCompensation(authReq.user.shopId, employeeId);
      sendResponse(res, 200, compensation, 'Compensation profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getCompensationHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { employeeId } = req.params;
      const history = await this.service.getCompensationHistory(authReq.user.shopId, employeeId);
      sendResponse(res, 200, history, 'Compensation history retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  setCompensation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { employeeId } = req.params;
      const compensation = await this.service.setCompensation(
        authReq.user.shopId,
        employeeId,
        authReq.user.id,
        req.body,
      );
      sendResponse(res, 201, compensation, 'Compensation profile created successfully');
    } catch (error) {
      next(error);
    }
  };

  updateCompensation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { employeeId, id } = req.params;
      const updated = await this.service.updateCompensation(
        authReq.user.shopId,
        employeeId,
        id,
        authReq.user.id,
        req.body,
      );
      sendResponse(res, 200, updated, 'Compensation profile updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const compensationController = new CompensationController();
