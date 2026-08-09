import type { Request, Response } from 'express';
import { healthService } from '../services/health.service';
import { sendResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const healthData = healthService.getHealthStatus();
  sendResponse(res, 200, healthData, 'API health status retrieved successfully');
});

export const getVersion = asyncHandler(async (_req: Request, res: Response) => {
  const versionData = healthService.getVersionInfo();
  sendResponse(res, 200, versionData, 'API version information retrieved successfully');
});
