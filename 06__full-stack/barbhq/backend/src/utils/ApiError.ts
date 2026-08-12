export interface ErrorItem {
  field?: string;
  message: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public statusCode: number;
  public errors: ErrorItem[];
  public isOperational: boolean;

  constructor(statusCode: number, message: string, errors: ErrorItem[] = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
