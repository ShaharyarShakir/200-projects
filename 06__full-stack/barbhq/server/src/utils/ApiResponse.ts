import type { Response } from 'express';

export class ApiResponse<T = any> {
  public success: boolean;
  public message: string;
  public data: T;
  public meta?: Record<string, any>;

  constructor(statusCode: number, data: T, message = 'Success', meta?: Record<string, any>) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: T,
  message = 'Success',
  meta?: Record<string, any>,
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};
