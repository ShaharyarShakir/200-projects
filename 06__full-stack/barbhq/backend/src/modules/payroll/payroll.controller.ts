import type { Request, Response, NextFunction } from 'express';
import { payrollService, PayrollService } from './payroll.service';
import { sendResponse } from '../../utils/ApiResponse';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { ApiError } from '../../utils/ApiError';

export class PayrollController {
  constructor(private service: PayrollService = payrollService) {}

  createPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const period = await this.service.createPeriod(authReq.user.shopId, authReq.user.id, req.body);
      sendResponse(res, 201, period, 'Payroll period created successfully');
    } catch (error) {
      next(error);
    }
  };

  getPeriods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { status } = req.query as any;
      const periods = await this.service.getPeriods(authReq.user.shopId, status);
      sendResponse(res, 200, periods, 'Payroll periods retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getPeriodById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const period = await this.service.getPeriodById(id, authReq.user.shopId);
      sendResponse(res, 200, period, 'Payroll period retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  processPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const period = await this.service.processPayrollPeriod(id, authReq.user.shopId, authReq.user.id);
      sendResponse(res, 200, period, 'Payroll processed successfully');
    } catch (error) {
      next(error);
    }
  };

  finalizePeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const period = await this.service.finalizePayrollPeriod(id, authReq.user.shopId, authReq.user.id);
      sendResponse(res, 200, period, 'Payroll period finalized successfully');
    } catch (error) {
      next(error);
    }
  };

  markPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const period = await this.service.markPayrollPeriodPaid(id, authReq.user.shopId, authReq.user.id);
      sendResponse(res, 200, period, 'Payroll period marked as paid');
    } catch (error) {
      next(error);
    }
  };

  getPeriodRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { periodId } = req.params;
      const records = await this.service.getPeriodRecords(authReq.user.shopId, periodId);
      sendResponse(res, 200, records, 'Payroll records retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getEmployeeRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { periodId, employeeId } = req.params;

      // Role check: BARBER / RECEPTIONIST can only view own record
      if (authReq.user.role === 'BARBER' || authReq.user.role === 'RECEPTIONIST') {
        if (authReq.user.id !== employeeId) {
          throw new ApiError(403, 'Forbidden: You can only view your own payroll record');
        }
      }

      const record = await this.service.getEmployeeRecordInPeriod(authReq.user.shopId, periodId, employeeId);
      sendResponse(res, 200, record, 'Employee payroll record retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getMyPaystubs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const paystubs = await this.service.getMyPaystubs(authReq.user.shopId, authReq.user.id);
      sendResponse(res, 200, paystubs, 'Your paystubs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  addAdjustment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const adjustment = await this.service.addAdjustment(
        authReq.user.shopId,
        id,
        authReq.user.id,
        req.body,
      );
      sendResponse(res, 201, adjustment, 'Payroll adjustment added successfully');
    } catch (error) {
      next(error);
    }
  };

  getAdjustments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      // Access control check for viewing record adjustments
      const record = await this.service['repository'].findRecordById(id, authReq.user.shopId);
      if (!record) {
        throw new ApiError(404, 'Payroll record not found');
      }
      if (
        (authReq.user.role === 'BARBER' || authReq.user.role === 'RECEPTIONIST') &&
        record.employeeId.toString() !== authReq.user.id
      ) {
        throw new ApiError(403, 'Forbidden: You can only view adjustments for your own payroll record');
      }

      const adjustments = await this.service.getAdjustments(authReq.user.shopId, id);
      sendResponse(res, 200, adjustments, 'Payroll adjustments retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteAdjustment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      await this.service.deleteAdjustment(id, authReq.user.shopId, authReq.user.id);
      sendResponse(res, 200, null, 'Payroll adjustment deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const dashboard = await this.service.getPayrollDashboard(authReq.user.shopId);
      sendResponse(res, 200, dashboard, 'Payroll dashboard data retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const payrollController = new PayrollController();
