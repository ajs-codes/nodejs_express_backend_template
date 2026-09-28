import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { loginBodySchema } from '../schemas/auth.schema.js';

export function createAuthRoutes(
  loginRateLimiter: ReturnType<typeof import('express-rate-limit').default>,
  refreshRateLimiter: ReturnType<typeof import('express-rate-limit').default>,
) {
  const router = Router();

  router.get('/csrf', authController.csrf);
  router.post(
    '/login',
    loginRateLimiter,
    validate({ body: loginBodySchema }),
    authController.login,
  );
  router.post('/refresh', refreshRateLimiter, authController.refresh);
  router.post('/logout', csrfProtection, authController.logout);
  router.get('/me', requireAuth, authController.me);

  return router;
}
