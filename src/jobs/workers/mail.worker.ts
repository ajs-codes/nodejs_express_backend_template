import { Worker } from 'bullmq';
import { getRedisConfig } from '../../config/redis.js';
import { getLogger } from '../../observability/logger.js';
import { sendTemplatedEmail } from '../../mail/mailer.js';
import { mailJobPayloadSchema, QUEUE_NAMES } from '../jobs.js';
import type { MailJobPayload } from '../../mail/types.js';

let mailWorker: Worker | null = null;

export function startMailWorker(): Worker {
  if (mailWorker) {
    return mailWorker;
  }

  const config = getRedisConfig();
  const logger = getLogger().child({ service: 'bullmq', queue: QUEUE_NAMES.MAIL });

  mailWorker = new Worker(
    QUEUE_NAMES.MAIL,
    async (job) => {
      const start = Date.now();
      const payload = mailJobPayloadSchema.parse(job.data);
      await sendTemplatedEmail(payload as MailJobPayload);
      logger.info({ jobId: job.id, durationMs: Date.now() - start }, 'Mail job completed');
    },
    { connection: { url: config.url }, concurrency: 5 },
  );

  mailWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Mail job failed');
  });

  logger.info('Mail worker started');
  return mailWorker;
}

export async function stopMailWorker(): Promise<void> {
  if (mailWorker) {
    await mailWorker.close();
    mailWorker = null;
  }
}
