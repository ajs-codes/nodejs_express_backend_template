import { getEnv } from './env.js';

export function getMailConfig() {
  const env = getEnv();
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM,
  } as const;
}
