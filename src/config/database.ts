import { getEnv } from './env.js';

export function getDatabaseConfig() {
  const env = getEnv();
  return {
    url: env.DATABASE_URL,
    maxConnections: 20,
    idleTimeoutMs: 30_000,
    connectionTimeoutMs: 5_000,
  } as const;
}
