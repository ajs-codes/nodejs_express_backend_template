import { Queue } from 'bullmq';
import { getRedisConfig } from '../../config/redis.js';
import { QUEUE_NAMES, type MailJobPayloadInput } from '../jobs.js';

let mailQueue: Queue<MailJobPayloadInput> | null = null;

export function getMailQueue(): Queue<MailJobPayloadInput> {
  if (!mailQueue) {
    const config = getRedisConfig();
    mailQueue = new Queue<MailJobPayloadInput>(QUEUE_NAMES.MAIL, {
      connection: { url: config.url },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });
  }
  return mailQueue;
}

export async function closeMailQueue(): Promise<void> {
  if (mailQueue) {
    await mailQueue.close();
    mailQueue = null;
  }
}
