import { Request, Response, NextFunction } from 'express';
import { handleError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface ErrorRequest extends Request {
  userId?: string;
}

export const errorHandler = (
  error: any,
  req: ErrorRequest,
  res: Response,
  next: NextFunction,
) => {
  logger.error('Error', {
    message: error.message,
    statusCode: error.statusCode,
    userId: req.userId,
    path: req.path,
    method: req.method,
  });

  const errorResponse = handleError(error);

  res.status(errorResponse.statusCode).json({
    error: errorResponse.message,
    ...(process.env.NODE_ENV === 'development' && { details: errorResponse.details }),
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
