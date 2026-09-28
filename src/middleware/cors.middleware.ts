import cors from 'cors';
import { getCorsConfig } from '../config/cors.js';

export function createCorsMiddleware() {
  const config = getCorsConfig();
  return cors({
    origin(origin, callback) {
      if (!origin || config.origins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: config.credentials,
  });
}
