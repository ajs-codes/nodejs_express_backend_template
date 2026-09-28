import { getEnv } from './env.js';

export function getAuthConfig() {
  const env = getEnv();
  return {
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtAccessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    cookieName: env.COOKIE_NAME,
    refreshCookieName: env.REFRESH_COOKIE_NAME,
    csrfCookieName: env.CSRF_COOKIE_NAME,
    csrfSidCookieName: env.CSRF_SID_COOKIE_NAME,
    cookieDomain: env.COOKIE_DOMAIN,
    cookieSecure: env.COOKIE_SECURE ?? false,
    cookieSameSite: env.COOKIE_SAME_SITE,
    csrfSecret: env.CSRF_SECRET,
  } as const;
}
