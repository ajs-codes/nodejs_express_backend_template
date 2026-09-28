import type { Express } from 'express';
import { createApp } from '../../../src/app.js';
import { createAuthenticatedUser } from '../../factories/user.factory.js';
import { getSetCookies, mergeCookies } from '../../helpers/auth.helper.js';
import { resetDatabase } from '../../helpers/db.helper.js';
import { api } from '../../helpers/request.helper.js';
import { teardownTestConnections } from '../../setup/teardown.js';

describe('Auth me', () => {
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

  it('GET /api/auth/me returns authenticated user', async () => {
    const { user, password } = await createAuthenticatedUser({ email: 'me@example.com' });

    const loginResponse = await api(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });

    const cookies = getSetCookies(loginResponse.headers);

    const response = await api(app).get('/api/auth/me').set('Cookie', mergeCookies([], cookies));

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe(user.id);
    expect(response.body.data.user.email).toBe(user.email);
  });

  it('GET /api/auth/me returns 401 without auth', async () => {
    const response = await api(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });
});
