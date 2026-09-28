import { createServer } from 'node:http';
import { getAppConfig } from './config/app.js';
import { closeDatabase } from './db/client.js';
import { closeMailQueue } from './jobs/queues/mail.queue.js';
import { getLogger } from './observability/logger.js';
import { closeRedis } from './redis/client.js';
import { createApp } from './app.js';

const logger = getLogger();
let isShuttingDown = false;

async function bootstrap() {
  const appConfig = getAppConfig();
  const app = await createApp();
  const server = createServer(app);

  server.listen(appConfig.port, () => {
    logger.info({ port: appConfig.port, env: appConfig.nodeEnv }, 'API server started');
  });

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    logger.info({ signal }, 'Graceful shutdown initiated');

    server.close(async () => {
      try {
        await closeMailQueue();
        await closeRedis();
        await closeDatabase();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start API server');
  process.exit(1);
});
