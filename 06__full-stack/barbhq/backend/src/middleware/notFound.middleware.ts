import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new ApiError(404, `Route Not Found - ${req.method} ${req.originalUrl}`);
  next(error);
};
