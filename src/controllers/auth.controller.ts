import type { Request, Response, NextFunction } from 'express';
import { getAuthConfig } from '../config/auth.js';
import { authService } from '../services/auth.service.js';
import { generateCsrfToken, ensureCsrfSidCookie } from '../middleware/csrf.middleware.js';

export const authController = {
  async csrf(req: Request, res: Response): Promise<void> {
    ensureCsrfSidCookie(req, res);
    const csrfToken = generateCsrfToken(req, res);
    res.json({ success: true, data: { csrfToken } });
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await authService.login(email, password, req, res);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authConfig = getAuthConfig();
      const refreshToken = req.cookies?.[authConfig.refreshCookieName] as string | undefined;
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: { code: 'SESSION_EXPIRED', message: 'Refresh token missing' },
        });
        return;
      }
      const result = await authService.refresh(refreshToken, res);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authConfig = getAuthConfig();
      const refreshToken = req.cookies?.[authConfig.refreshCookieName] as string | undefined;
      await authService.logout(refreshToken, res);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
      }
      const result = await authService.getCurrentUser(req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
