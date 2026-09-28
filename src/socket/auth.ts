import type { Socket } from 'socket.io';
import { getAuthConfig } from '../config/auth.js';
import { verifyAccessToken } from '../auth/jwt.js';
import type { SocketUser } from './types/index.js';

export function authenticateSocket(socket: Socket): SocketUser | null {
  const authConfig = getAuthConfig();
  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, rest.join('=')];
    }),
  );

  const token = cookies[authConfig.cookieName];
  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}
