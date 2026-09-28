import { getAppConfig } from './app.js';
import { getCorsConfig } from './cors.js';

export function getWebsocketConfig() {
  const appConfig = getAppConfig();
  const corsConfig = getCorsConfig();
  return {
    port: appConfig.socketPort,
    cors: {
      origin: corsConfig.origins,
      credentials: corsConfig.credentials,
    },
  } as const;
}
