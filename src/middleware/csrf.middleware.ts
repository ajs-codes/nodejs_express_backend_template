import { randomUUID } from 'node:crypto';
import { doubleCsrf } from 'csrf-csrf';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { getAuthConfig } from '../config/auth.js';

let csrfInstance: ReturnType<typeof doubleCsrf> | null = null;

function getCsrfInstance() {
  if (!csrfInstance) {
    const authConfig = getAuthConfig();
    csrfInstance = doubleCsrf({
      getSecret: () => authConfig.csrfSecret,
      getSessionIdentifier: (req) => {
        const refreshCookie = req.cookies?.[authConfig.refreshCookieName] as string | undefined;
        if (refreshCookie) {
          return refreshCookie;
        }
        const csrfSid = req.cookies?.[authConfig.csrfSidCookieName] as string | undefined;
        if (csrfSid) {
          return csrfSid;
        }
        return 'anonymous';
      },
      cookieName: authConfig.csrfCookieName,
      cookieOptions: {
        httpOnly: false,
        secure: authConfig.cookieSecure,
        sameSite: authConfig.cookieSameSite,
        path: '/',
        ...(authConfig.cookieDomain ? { domain: authConfig.cookieDomain } : {}),
      } satisfies CookieOptions,
      getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string | undefined,
    });
  }
  return csrfInstance;
}

export function generateCsrfToken(req: Request, res: Response): string {
  const { generateCsrfToken: generate } = getCsrfInstance();
  return generate(req, res);
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const { doubleCsrfProtection } = getCsrfInstance();
  doubleCsrfProtection(req, res, next);
}

export function ensureCsrfSidCookie(req: Request, res: Response): void {
  const authConfig = getAuthConfig();
  const existingSid = req.cookies?.[authConfig.csrfSidCookieName] as string | undefined;
  if (!existingSid) {
    const sid = randomUUID();
    res.cookie(authConfig.csrfSidCookieName, sid, {
      httpOnly: true,
      secure: authConfig.cookieSecure,
      sameSite: authConfig.cookieSameSite,
      path: '/',
      ...(authConfig.cookieDomain ? { domain: authConfig.cookieDomain } : {}),
    });
  }
}
