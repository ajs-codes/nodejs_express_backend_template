import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { pingRedis } from '../redis/client.js';

export const healthController = {
  live(_req: Request, res: Response): void {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  },

  async ready(_req: Request, res: Response): Promise<void> {
    const checks = await healthController.runChecks();
    const allHealthy = checks.postgres && checks.redis;
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });
  },

  async detailed(_req: Request, res: Response): Promise<void> {
    const checks = await healthController.runChecks();
    const allHealthy = checks.postgres && checks.redis;
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    });
  },

  async runChecks(): Promise<{ postgres: boolean; redis: boolean }> {
    let postgres = false;
    let redis = false;

    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      postgres = true;
    } catch {
      postgres = false;
    }

    redis = await pingRedis();

    return { postgres, redis };
  },
};
