import type { Socket } from 'socket.io';
import { authenticateSocket } from './auth.js';

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const user = authenticateSocket(socket);
  if (!user) {
    next(new Error('Unauthorized'));
    return;
  }
  socket.data.user = user;
  next();
}
