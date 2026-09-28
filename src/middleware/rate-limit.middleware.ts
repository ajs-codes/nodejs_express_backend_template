import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../redis/client.js';
import { ErrorCodes } from '../errors/error-codes.js';

async function createRedisStore(prefix: string) {
  const client = await getRedisClient();
  return new RedisStore({
    sendCommand: (...args: string[]) => client.sendCommand(args),
    prefix: `rl:${prefix}:`,
  });
}

export async function createGeneralRateLimiter() {
  const store = await createRedisStore('general');
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      error: { code: ErrorCodes.RATE_LIMITED, message: 'Too many requests' },
    },
  });
}

export async function createLoginRateLimiter() {
  const store = await createRedisStore('login');
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      error: { code: ErrorCodes.RATE_LIMITED, message: 'Too many login attempts' },
    },
  });
}

export async function createRefreshRateLimiter() {
  const store = await createRedisStore('refresh');
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      error: { code: ErrorCodes.RATE_LIMITED, message: 'Too many refresh attempts' },
    },
  });
}
