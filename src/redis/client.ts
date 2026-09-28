import { createClient, type RedisClientType } from 'redis';
import { getRedisConfig } from '../config/redis.js';
import { getLogger } from '../observability/logger.js';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    const config = getRedisConfig();
    redisClient = createClient({ url: config.url });

    redisClient.on('error', (error) => {
      getLogger().error({ err: error, service: 'redis' }, 'Redis client error');
    });

    await redisClient.connect();
    getLogger().info({ service: 'redis' }, 'Redis connected');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export async function pingRedis(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
