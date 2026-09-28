import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { getWebsocketConfig } from '../config/websocket.js';
import { getRedisConfig } from '../config/redis.js';
import { getLogger } from '../observability/logger.js';
import { socketAuthMiddleware } from './middleware.js';
import { registerConnectionHandlers } from './connection.js';

let io: Server | null = null;

export async function createSocketServer(): Promise<Server> {
  if (io) {
    return io;
  }

  const wsConfig = getWebsocketConfig();
  const redisConfig = getRedisConfig();
  const httpServer = createServer();

  io = new Server(httpServer, {
    cors: wsConfig.cors,
  });

  const pubClient = createClient({ url: redisConfig.url });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketAuthMiddleware);
  registerConnectionHandlers(io);

  await new Promise<void>((resolve) => {
    httpServer.listen(wsConfig.port, () => {
      getLogger().info({ port: wsConfig.port }, 'Socket.IO server listening');
      resolve();
    });
  });

  return io;
}

export async function closeSocketServer(): Promise<void> {
  if (io) {
    await io.close();
    io = null;
  }
}
