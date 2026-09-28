import { getEnv } from './env.js';

export function getAppConfig() {
  const env = getEnv();
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    socketPort: env.SOCKET_PORT,
    apiUrl: env.API_URL,
    trustProxy: env.TRUST_PROXY ?? false,
    logLevel: env.LOG_LEVEL,
    apiDocsPath: env.API_DOCS_PATH,
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    isDevelopment: env.NODE_ENV === 'development',
  } as const;
}
