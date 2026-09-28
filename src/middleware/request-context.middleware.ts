import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  next();
}
