import type { Socket } from 'socket.io';
import { authService } from '../../services/auth.service.js';
import type { SocketUser } from '../types/index.js';

export function registerSessionHandlers(socket: Socket): void {
  socket.on('session:whoami', async (callback?: (response: unknown) => void) => {
    try {
      const user = socket.data.user as SocketUser;
      const result = await authService.getCurrentUser(user.id);
      callback?.({ success: true, data: result });
    } catch (error) {
      callback?.({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  });
}
