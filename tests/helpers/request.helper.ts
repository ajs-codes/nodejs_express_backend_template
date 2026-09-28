import request from 'supertest';
import type { Express } from 'express';

export function api(app: Express) {
  return request(app);
}
