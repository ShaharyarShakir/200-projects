import type { Request, Response } from 'express';
import { env } from '../config/env';
import { sendResponse } from '../utils/ApiResponse';

const startTime = Date.now();

export const getHealth = (_req: Request, res: Response) => {
  const uptime = process.uptime();
  const healthData = {
    status: 'UP',
    uptime: `${Math.floor(uptime)}s`,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  };
  sendResponse(res, 200, healthData, 'API health retrieved successfully');
};

export const getVersion = (_req: Request, res: Response) => {
  const versionData = {
    version: '1.0.0',
    environment: env.NODE_ENV,
    apiVersion: 'v1',
    startedAt: new Date(startTime).toISOString(),
  };
  sendResponse(res, 200, versionData, 'API version retrieved successfully');
};
