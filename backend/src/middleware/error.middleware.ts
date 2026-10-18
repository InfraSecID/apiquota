import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error at [${req.method}] ${req.originalUrl}: ${err.message}`, {
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const statusCode = err.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred. Please try again later.'
      : err.message || 'Unknown server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
