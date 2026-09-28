import { closeDatabase } from '../../src/db/client.js';
import { closeMailQueue } from '../../src/jobs/queues/mail.queue.js';
import { closeRedis } from '../../src/redis/client.js';

export async function teardownTestConnections(): Promise<void> {
  await closeMailQueue();
  await closeRedis();
  await closeDatabase();
}
