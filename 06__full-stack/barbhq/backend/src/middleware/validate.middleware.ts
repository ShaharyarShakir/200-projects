import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

export interface ValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export const validate = (schema: ValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);
        Object.defineProperty(req, 'query', { value: parsedQuery, writable: true, configurable: true });
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as unknown as Request['params'];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        next(new ApiError(400, 'Validation failed', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
