import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getAuthConfig } from '../config/auth.js';
import { AppError } from '../errors/app-error.js';
import { generateId } from '../lib/ids.js';

export const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  email: z.email(),
  name: z.string(),
  type: z.literal('access'),
});

export const refreshTokenPayloadSchema = z.object({
  sub: z.uuid(),
  sessionId: z.uuid(),
  jti: z.string().min(1),
  type: z.literal('refresh'),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;
export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>;

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  const config = getAuthConfig();
  return jwt.sign({ ...payload, type: 'access' }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, 'type' | 'jti'>,
): string {
  const config = getAuthConfig();
  return jwt.sign({ ...payload, jti: generateId(), type: 'refresh' }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const config = getAuthConfig();
  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret);
    return accessTokenPayloadSchema.parse(decoded);
  } catch {
    throw AppError.unauthorized('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const config = getAuthConfig();
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret);
    return refreshTokenPayloadSchema.parse(decoded);
  } catch {
    throw AppError.sessionExpired('Invalid refresh token');
  }
}
