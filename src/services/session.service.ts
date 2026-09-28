import type { Request } from 'express';
import { getAuthConfig } from '../config/auth.js';
import { addDurationToDate, isExpired } from '../lib/dates.js';
import { sha256 } from '../lib/crypto.js';
import { AppError } from '../errors/app-error.js';
import { signRefreshToken, verifyRefreshToken } from '../auth/jwt.js';
import { sessionRepository } from '../repositories/session.repository.js';
import type { Session, User } from '../db/schema.js';

export const sessionService = {
  async createSession(
    user: User,
    req: Request,
  ): Promise<{ session: Session; refreshToken: string }> {
    const authConfig = getAuthConfig();
    const expiresAt = addDurationToDate(authConfig.jwtRefreshExpiresIn);

    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: '',
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt,
    });

    const refreshToken = signRefreshToken({ sub: user.id, sessionId: session.id });
    const refreshTokenHash = sha256(refreshToken);

    await sessionRepository.updateRefreshTokenHash(session.id, refreshTokenHash, expiresAt);

    const updatedSession = await sessionRepository.findById(session.id);
    if (!updatedSession) {
      throw AppError.internal('Failed to create session');
    }

    return { session: updatedSession, refreshToken };
  },

  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<{ session: Session; refreshToken: string; userId: string }> {
    const payload = verifyRefreshToken(refreshToken);
    const session = await sessionRepository.findActiveById(payload.sessionId);

    if (!session || session.userId !== payload.sub) {
      throw AppError.sessionExpired();
    }

    if (isExpired(session.expiresAt)) {
      await sessionRepository.revoke(session.id);
      throw AppError.sessionExpired();
    }

    const tokenHash = sha256(refreshToken);
    if (tokenHash !== session.refreshTokenHash) {
      await sessionRepository.revoke(session.id);
      throw AppError.sessionExpired('Refresh token reuse detected');
    }

    const authConfig = getAuthConfig();
    const expiresAt = addDurationToDate(authConfig.jwtRefreshExpiresIn);
    const newRefreshToken = signRefreshToken({ sub: session.userId, sessionId: session.id });
    const newRefreshTokenHash = sha256(newRefreshToken);

    await sessionRepository.updateRefreshTokenHash(session.id, newRefreshTokenHash, expiresAt);

    const updatedSession = await sessionRepository.findById(session.id);
    if (!updatedSession) {
      throw AppError.internal('Failed to rotate session');
    }

    return { session: updatedSession, refreshToken: newRefreshToken, userId: session.userId };
  },

  async revokeSession(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await sessionRepository.revoke(payload.sessionId);
    } catch {
      // Ignore invalid tokens on logout
    }
  },
};
