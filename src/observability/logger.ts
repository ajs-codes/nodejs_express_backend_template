import pino from 'pino';
import { getAppConfig } from '../config/app.js';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.csrfToken',
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'csrfToken',
  'cookie',
  'authorization',
];

let loggerInstance: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    const appConfig = getAppConfig();
    loggerInstance = pino({
      level: appConfig.logLevel,
      redact: {
        paths: REDACT_PATHS,
        censor: '[REDACTED]',
      },
      ...(appConfig.isDevelopment && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
    });
  }
  return loggerInstance;
}

export function createChildLogger(bindings: Record<string, unknown>): pino.Logger {
  return getLogger().child(bindings);
}
