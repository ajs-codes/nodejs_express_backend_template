import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { getAppConfig } from './config/app.js';
import { passport } from './auth/passport.js';
import { createCorsMiddleware } from './middleware/cors.middleware.js';
import { securityMiddleware } from './middleware/security.middleware.js';
import { requestContextMiddleware } from './middleware/request-context.middleware.js';
import { createHttpLogger } from './observability/http-logger.js';
import {
  createGeneralRateLimiter,
  createLoginRateLimiter,
  createRefreshRateLimiter,
} from './middleware/rate-limit.middleware.js';
import { createApiRoutes } from './routes/index.js';
import { healthRoutes } from './routes/health.routes.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware.js';
import { generateOpenApiDocument } from './docs/openapi.js';

export async function createApp() {
  const appConfig = getAppConfig();
  const app = express();

  app.set('trust proxy', appConfig.trustProxy);

  app.use(requestContextMiddleware);
  app.use(createHttpLogger());
  app.use(createCorsMiddleware());
  app.use(...securityMiddleware);
  app.use(cookieParser());
  app.use(passport.initialize());

  const generalRateLimiter = await createGeneralRateLimiter();
  const loginRateLimiter = await createLoginRateLimiter();
  const refreshRateLimiter = await createRefreshRateLimiter();

  app.use(generalRateLimiter);

  app.use(
    appConfig.apiDocsPath,
    swaggerUi.serve,
    swaggerUi.setup(generateOpenApiDocument(), { explorer: true }),
  );

  app.use('/health', healthRoutes);
  app.use('/api', createApiRoutes(loginRateLimiter, refreshRateLimiter));

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
