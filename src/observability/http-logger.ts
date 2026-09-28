import { pinoHttp } from 'pino-http';
import type { Request, Response } from 'express';
import { getLogger } from './logger.js';

export function createHttpLogger() {
  return pinoHttp({
    logger: getLogger(),
    customProps: (req: Request, _res: Response) => ({
      requestId: req.requestId,
      userId: req.user?.id,
    }),
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          route: req.route?.path,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  });
}
