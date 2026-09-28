import type { AuthenticatedUser } from './user.js';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthenticatedUser {}
    interface Request {
      requestId: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
