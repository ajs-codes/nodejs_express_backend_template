import type { Express } from 'express';
import { createApp } from '../../../src/app.js';
import { resetDatabase } from '../../helpers/db.helper.js';
import { getCsrfToken } from '../../helpers/auth.helper.js';
import { teardownTestConnections } from '../../setup/teardown.js';

describe('CSRF', () => {
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

  it('GET /api/auth/csrf returns a token', async () => {
    const { csrfToken } = await getCsrfToken(app);
    expect(csrfToken).toBeDefined();
    expect(typeof csrfToken).toBe('string');
    expect(csrfToken.length).toBeGreaterThan(10);
  });
});
