import { getEnv } from './env.js';

export function getCorsConfig() {
  const env = getEnv();
  return {
    origins: env.CORS_ORIGINS,
    credentials: true,
  } as const;
}
