import { getEnv } from './env.js';

export function getRedisConfig() {
  const env = getEnv();
  return {
    url: env.REDIS_URL,
  } as const;
}
