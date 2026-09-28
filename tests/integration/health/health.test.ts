import type { Express } from 'express';
import { createApp } from '../../../src/app.js';
import { resetDatabase } from '../../helpers/db.helper.js';
import { api } from '../../helpers/request.helper.js';
import { teardownTestConnections } from '../../setup/teardown.js';

describe('Health endpoints', () => {
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

  it('GET /health/live returns ok', async () => {
    const response = await api(app).get('/health/live');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /health/ready checks dependencies', async () => {
    const response = await api(app).get('/health/ready');
    expect(response.status).toBe(200);
    expect(response.body.checks.postgres).toBe(true);
    expect(response.body.checks.redis).toBe(true);
  });
});
