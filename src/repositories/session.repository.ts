import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { sessions, type NewSession, type Session } from '../db/schema.js';

export const sessionRepository = {
  async findById(id: string): Promise<Session | null> {
    const db = getDb();
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return session ?? null;
  },

  async findActiveById(id: string): Promise<Session | null> {
    const db = getDb();
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)))
      .limit(1);
    return session ?? null;
  },

  async create(data: NewSession): Promise<Session> {
    const db = getDb();
    const [session] = await db.insert(sessions).values(data).returning();
    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  },

  async updateRefreshTokenHash(
    id: string,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const db = getDb();
    await db
      .update(sessions)
      .set({ refreshTokenHash, expiresAt, updatedAt: new Date() })
      .where(eq(sessions.id, id));
  },

  async revoke(id: string): Promise<void> {
    const db = getDb();
    await db
      .update(sessions)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(sessions.id, id));
  },

  async revokeAllForUser(userId: string): Promise<void> {
    const db = getDb();
    await db
      .update(sessions)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  },
};
