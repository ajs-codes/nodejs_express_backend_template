import type { Session } from '../../src/db/schema.js';
import { sessionRepository } from '../../src/repositories/session.repository.js';
import { sha256 } from '../../src/lib/crypto.js';

type CreateSessionOverrides = Partial<{
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}>;

export async function createSession(overrides: CreateSessionOverrides): Promise<Session> {
  const refreshToken = overrides.refreshToken ?? 'test-refresh-token';
  return sessionRepository.create({
    userId: overrides.userId!,
    refreshTokenHash: sha256(refreshToken),
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}
