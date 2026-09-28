import { Router } from 'express';
import { createAuthRoutes } from './auth.routes.js';

export function createApiRoutes(
  loginRateLimiter: ReturnType<typeof import('express-rate-limit').default>,
  refreshRateLimiter: ReturnType<typeof import('express-rate-limit').default>,
) {
  const router = Router();

  router.use('/auth', createAuthRoutes(loginRateLimiter, refreshRateLimiter));

  return router;
}
