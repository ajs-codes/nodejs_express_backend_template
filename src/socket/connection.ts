import type { Server, Socket } from 'socket.io';
import { getLogger } from '../observability/logger.js';
import { registerSessionHandlers } from './handlers/session.handler.js';

export function registerConnectionHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    const logger = getLogger().child({ service: 'socket.io', socketId: socket.id });
    logger.info({ userId: socket.data.user?.id }, 'Socket connected');

    registerSessionHandlers(socket);

    socket.on('disconnect', (reason) => {
      logger.info({ reason, userId: socket.data.user?.id }, 'Socket disconnected');
    });
  });
}
