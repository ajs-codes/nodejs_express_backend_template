import type { Request, Response } from 'express';
import { getAuthConfig } from '../config/auth.js';
import { AppError } from '../errors/app-error.js';
import { verifyPassword } from '../auth/password.js';
import { signAccessToken } from '../auth/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { sessionService } from './session.service.js';
import type { User } from '../db/schema.js';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const authConfig = getAuthConfig();
  const cookieOptions = {
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
    path: '/',
    ...(authConfig.cookieDomain ? { domain: authConfig.cookieDomain } : {}),
  } as const;

  res.cookie(authConfig.cookieName, accessToken, cookieOptions);
  res.cookie(authConfig.refreshCookieName, refreshToken, cookieOptions);
}

function clearAuthCookies(res: Response): void {
  const authConfig = getAuthConfig();
  const cookieOptions = {
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
    path: '/',
    ...(authConfig.cookieDomain ? { domain: authConfig.cookieDomain } : {}),
  } as const;

  res.clearCookie(authConfig.cookieName, cookieOptions);
  res.clearCookie(authConfig.refreshCookieName, cookieOptions);
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export const authService = {
  async login(email: string, password: string, req: Request, res: Response) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw AppError.invalidCredentials();
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw AppError.invalidCredentials();
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    const { refreshToken } = await sessionService.createSession(user, req);
    setAuthCookies(res, accessToken, refreshToken);

    return { user: toPublicUser(user) };
  },

  async refresh(refreshToken: string, res: Response) {
    const { refreshToken: newRefreshToken, userId } =
      await sessionService.rotateRefreshToken(refreshToken);

    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.sessionExpired();
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    setAuthCookies(res, accessToken, newRefreshToken);
    return { user: toPublicUser(user) };
  },

  async logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      await sessionService.revokeSession(refreshToken);
    }
    clearAuthCookies(res);
  },

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.unauthorized();
    }
    return { user: toPublicUser(user) };
  },

  getUserFromAccessTokenPayload(payload: { sub: string; email: string; name: string }) {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  },
};
