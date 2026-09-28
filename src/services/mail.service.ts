import { getMailQueue } from '../jobs/queues/mail.queue.js';
import type { MailJobPayload } from '../mail/types.js';

export const mailService = {
  async enqueue(payload: MailJobPayload): Promise<void> {
    const queue = getMailQueue();
    await queue.add(payload.template, payload);
  },
};
