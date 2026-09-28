import nodemailer from 'nodemailer';
import { getMailConfig } from '../config/mail.js';
import { getLogger } from '../observability/logger.js';
import { renderMailTemplate } from './render.js';
import type { MailJobPayload } from './types.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const config = getMailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: config.user
        ? {
            user: config.user,
            pass: config.password,
          }
        : undefined,
    });
  }
  return transporter;
}

export async function sendTemplatedEmail(payload: MailJobPayload): Promise<void> {
  const logger = getLogger().child({ service: 'email', operation: payload.template });
  const config = getMailConfig();
  const start = Date.now();

  const { html, text } = await renderMailTemplate(payload.template, payload.data);

  await getTransporter().sendMail({
    from: config.from,
    to: payload.to,
    subject: payload.subject,
    html,
    text,
  });

  logger.info({ durationMs: Date.now() - start, success: true, to: payload.to }, 'Email sent');
}
