import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import type { ErrorItem } from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface MongooseError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  value?: unknown;
  path?: string;
  errors?: Record<string, { message: string }>;
}

export const errorHandler = (err: MongooseError, req: Request, res: Response, _next: NextFunction): void => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else {
    let statusCode = 500;
    let message = err.message || 'Internal Server Error';
    let errorsList: ErrorItem[] = [];

    // Mongoose Duplicate Key Error (code 11000)
    if (err.code === 11000 && err.keyValue) {
      statusCode = 400;
      const fields = Object.keys(err.keyValue).join(', ');
      message = `Duplicate value for field: ${fields}`;
      errorsList = [{ field: fields, message: 'Value must be unique' }];
    }
    // Mongoose CastError (invalid ObjectId)
    else if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid ID format for ${err.path || 'resource'}`;
      errorsList = [{ field: err.path, message: 'Invalid ID format' }];
    }
    // Mongoose ValidationError
    else if (err.name === 'ValidationError' && err.errors) {
      statusCode = 400;
      message = 'Validation failed';
      errorsList = Object.keys(err.errors).map((key) => ({
        field: key,
        message: err.errors![key]?.message || 'Invalid value',
      }));
    }

    error = new ApiError(statusCode, message, errorsList, err.stack);
  }

  // Log non-operational or internal server errors
  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - Internal Error:`, error);
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    message: error.message,
    errors: error.errors || [],
  };

  if (env.NODE_ENV === 'development' && error.stack) {
    responseBody.stack = error.stack;
  }

  res.status(error.statusCode).json(responseBody);
};
