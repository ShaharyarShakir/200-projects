import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  let error = err;

  // Log critical or internal server errors
  logger.error(`${req.method} ${req.originalUrl} - Error occurred:`, error);

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue).join(', ');
    error = new ApiError(400, `Duplicate field value entered: ${fields}`, [
      { field: fields, message: 'Must be unique' },
    ]);
  }

  // Handle Mongoose CastError (e.g. invalid object ID)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Resource not found with id of ${err.value}`, [
      { field: err.path, message: 'Invalid ID format' },
    ]);
  }

  const responseBody = {
    success: false,
    message: error.message,
    errors: error.errors && error.errors.length > 0 ? error.errors : undefined,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(responseBody);
};
