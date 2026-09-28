import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { getAppConfig } from '../config/app.js';
import { getLogger } from '../observability/logger.js';

export function notFoundMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound('Route not found'));
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const logger = getLogger().child({ requestId: req.requestId });
  const appConfig = getAppConfig();

  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, err.message);
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  if (err instanceof z.ZodError) {
    logger.warn({ err }, 'Validation error');
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details: err.issues,
      },
    });
    return;
  }

  if (err instanceof Error && err.message === 'invalid csrf token') {
    logger.warn({ err }, 'CSRF validation failed');
    res.status(403).json({
      success: false,
      error: {
        code: ErrorCodes.CSRF_INVALID,
        message: 'Invalid CSRF token',
      },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: appConfig.isProduction ? 'Internal server error' : (err as Error)?.message,
    },
  });
}
