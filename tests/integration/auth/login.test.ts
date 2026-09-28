import type { Express } from 'express';
import { eq } from 'drizzle-orm';
import { createApp } from '../../../src/app.js';
import { getDb } from '../../../src/db/client.js';
import { sessions } from '../../../src/db/schema.js';
import { createAuthenticatedUser } from '../../factories/user.factory.js';
import { resetDatabase } from '../../helpers/db.helper.js';
import { getSetCookies } from '../../helpers/auth.helper.js';
import { api } from '../../helpers/request.helper.js';
import { teardownTestConnections } from '../../setup/teardown.js';

describe('Auth login', () => {
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

  it('POST /api/auth/login sets cookies and creates session in DB', async () => {
    const { user, password } = await createAuthenticatedUser({
      email: 'login@example.com',
    });

    const response = await api(app).post('/api/auth/login').send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(user.email);

    const cookies = getSetCookies(response.headers);
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);

    const db = getDb();
    const dbSessions = await db.select().from(sessions).where(eq(sessions.userId, user.id));
    expect(dbSessions).toHaveLength(1);
    expect(dbSessions[0]?.revokedAt).toBeNull();
  });

  it('POST /api/auth/login rejects invalid credentials', async () => {
    const { user } = await createAuthenticatedUser({ email: 'bad@example.com' });

    const response = await api(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword!' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
