import { getLogger } from './observability/logger.js';
import { startMailWorker, stopMailWorker } from './jobs/workers/mail.worker.js';
import { closeRedis } from './redis/client.js';

const logger = getLogger();
let isShuttingDown = false;

async function bootstrap() {
  startMailWorker();
  logger.info('Worker process started');

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    logger.info({ signal }, 'Worker shutdown initiated');

    try {
      await stopMailWorker();
      await closeRedis();
      logger.info('Worker shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Worker shutdown error');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start worker');
  process.exit(1);
});
