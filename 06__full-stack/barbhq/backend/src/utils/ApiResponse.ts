import type { Response } from 'express';

export interface MetaData {
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export class ApiResponse<T = unknown> {
  public success: boolean;
  public message: string;
  public data: T;
  public meta: MetaData;

  constructor(statusCode: number, data: T, message = 'Success', meta: MetaData = {}) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: T,
  message = 'Success',
  meta: MetaData = {},
): Response => {
  const responseInstance = new ApiResponse(statusCode, data, message, meta);
  return res.status(statusCode).json({
    success: responseInstance.success,
    message: responseInstance.message,
    data: responseInstance.data,
    meta: responseInstance.meta,
  });
};
