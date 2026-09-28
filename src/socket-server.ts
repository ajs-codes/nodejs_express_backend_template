import { getLogger } from './observability/logger.js';
import { createSocketServer, closeSocketServer } from './socket/server.js';

const logger = getLogger();
let isShuttingDown = false;

async function bootstrap() {
  await createSocketServer();
  logger.info('Socket server process started');

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    logger.info({ signal }, 'Socket server shutdown initiated');

    try {
      await closeSocketServer();
      logger.info('Socket server shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Socket server shutdown error');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start socket server');
  process.exit(1);
});
