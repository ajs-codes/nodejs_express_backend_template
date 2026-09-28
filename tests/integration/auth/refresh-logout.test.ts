import type { Express } from 'express';
import { eq } from 'drizzle-orm';
import { createApp } from '../../../src/app.js';
import { getDb } from '../../../src/db/client.js';
import { sessions } from '../../../src/db/schema.js';
import { createAuthenticatedUser } from '../../factories/user.factory.js';
import { getCsrfToken, getSetCookies, mergeCookies } from '../../helpers/auth.helper.js';
import { resetDatabase } from '../../helpers/db.helper.js';
import { api } from '../../helpers/request.helper.js';
import { teardownTestConnections } from '../../setup/teardown.js';

describe('Auth refresh and logout', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await teardownTestConnections();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('POST /api/auth/refresh rotates refresh token in DB', async () => {
    const { user, password } = await createAuthenticatedUser({ email: 'refresh@example.com' });

    const loginResponse = await api(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });

    const loginCookies = getSetCookies(loginResponse.headers);
    const cookieHeader = mergeCookies([], loginCookies);

    const db = getDb();
    const [beforeSession] = await db.select().from(sessions).where(eq(sessions.userId, user.id));
    const beforeHash = beforeSession?.refreshTokenHash;

    const refreshResponse = await api(app).post('/api/auth/refresh').set('Cookie', cookieHeader);

    expect(refreshResponse.status).toBe(200);

    const [afterSession] = await db.select().from(sessions).where(eq(sessions.userId, user.id));
    expect(afterSession?.refreshTokenHash).not.toBe(beforeHash);
  });

  it('POST /api/auth/logout revokes session with CSRF', async () => {
    const { user, password } = await createAuthenticatedUser({ email: 'logout@example.com' });

    const loginResponse = await api(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });

    let cookies = getSetCookies(loginResponse.headers);

    const cookieHeader = mergeCookies([], cookies);
    const { csrfToken, cookies: csrfCookies } = await getCsrfToken(app, cookieHeader);
    cookies = [...cookies, ...csrfCookies];

    const logoutResponse = await api(app)
      .post('/api/auth/logout')
      .set('Cookie', mergeCookies([], cookies))
      .set('X-CSRF-Token', csrfToken);

    expect(logoutResponse.status).toBe(200);

    const db = getDb();
    const dbSessions = await db.select().from(sessions).where(eq(sessions.userId, user.id));
    expect(dbSessions[0]?.revokedAt).not.toBeNull();
  });
});
