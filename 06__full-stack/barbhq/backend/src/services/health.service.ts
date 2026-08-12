import mongoose from 'mongoose';
import { env } from '../config/env';

export interface SystemHealthData {
  status: string;
  uptime: string;
  timestamp: string;
  environment: string;
  database: {
    status: string;
    host: string;
    name: string;
  };
}

export interface SystemVersionData {
  version: string;
  apiVersion: string;
  environment: string;
  startedAt: string;
}

const startTime = Date.now();

const dbStateMap: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export class HealthService {
  public getHealthStatus(): SystemHealthData {
    const uptimeSeconds = Math.floor(process.uptime());
    const dbStateCode = mongoose.connection.readyState;
    const dbStatus = dbStateMap[dbStateCode] || 'unknown';

    return {
      status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
      uptime: `${uptimeSeconds}s`,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: {
        status: dbStatus,
        host: mongoose.connection.host || 'N/A',
        name: mongoose.connection.name || 'barbersaas',
      },
    };
  }

  public getVersionInfo(): SystemVersionData {
    return {
      version: '1.0.0',
      apiVersion: 'v1',
      environment: env.NODE_ENV,
      startedAt: new Date(startTime).toISOString(),
    };
  }
}

export const healthService = new HealthService();
