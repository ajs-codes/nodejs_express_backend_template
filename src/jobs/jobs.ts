import { z } from 'zod';

export const QUEUE_NAMES = {
  MAIL: 'mail',
} as const;

export const mailJobPayloadSchema = z.object({
  to: z.email(),
  subject: z.string().min(1),
  template: z.enum(['welcome', 'email-verification', 'password-reset']),
  data: z.record(z.string(), z.unknown()),
});

export type MailJobPayloadInput = z.infer<typeof mailJobPayloadSchema>;
