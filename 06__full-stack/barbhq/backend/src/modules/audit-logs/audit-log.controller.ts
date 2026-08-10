import type { Request, Response } from 'express';
import { auditLogService, AuditLogService } from './audit-log.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class AuditLogController {
  constructor(private service: AuditLogService = auditLogService) {}

  getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const logs = await this.service.getShopAuditLogs(shopId, limit);
    sendResponse(res, 200, logs, 'Audit logs retrieved successfully');
  });
}

export const auditLogController = new AuditLogController();
