import { ErrorCodes, type ErrorCode } from './error-codes.js';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, ErrorCodes.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, ErrorCodes.UNAUTHORIZED, message);
  }

  static invalidCredentials(message = 'Invalid credentials'): AppError {
    return new AppError(401, ErrorCodes.INVALID_CREDENTIALS, message);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, ErrorCodes.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, ErrorCodes.NOT_FOUND, message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, ErrorCodes.CONFLICT, message);
  }

  static sessionExpired(message = 'Session expired'): AppError {
    return new AppError(401, ErrorCodes.SESSION_EXPIRED, message);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, ErrorCodes.INTERNAL_ERROR, message);
  }
}
