import type { NextFunction, Request, Response } from 'express';
import { passport } from '../auth/passport.js';
import { AppError } from '../errors/app-error.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: Express.Request['user'] | false) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        next(AppError.unauthorized());
        return;
      }
      req.user = user;
      next();
    },
  )(req, res, next);
}
