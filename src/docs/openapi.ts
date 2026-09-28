import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { getAppConfig } from '../config/app.js';
import {
  csrfResponseSchema,
  loginBodySchema,
  loginResponseSchema,
  meResponseSchema,
} from '../schemas/auth.schema.js';
import { errorResponseSchema, healthStatusSchema } from '../schemas/common.schema.js';

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'get',
  path: '/health/live',
  tags: ['Health'],
  summary: 'Liveness probe',
  responses: {
    200: {
      description: 'Service is alive',
      content: { 'application/json': { schema: healthStatusSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/health/ready',
  tags: ['Health'],
  summary: 'Readiness probe',
  responses: {
    200: {
      description: 'Dependencies are healthy',
      content: { 'application/json': { schema: healthStatusSchema } },
    },
    503: {
      description: 'Dependencies are degraded',
      content: { 'application/json': { schema: healthStatusSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/csrf',
  tags: ['Auth'],
  summary: 'Get CSRF token',
  responses: {
    200: {
      description: 'CSRF token issued',
      content: { 'application/json': { schema: csrfResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Login with email and password',
  request: {
    body: {
      content: { 'application/json': { schema: loginBodySchema } },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: { 'application/json': { schema: loginResponseSchema } },
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'Get current authenticated user',
  responses: {
    200: {
      description: 'Current user',
      content: { 'application/json': { schema: meResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export function generateOpenApiDocument() {
  const appConfig = getAppConfig();
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Node.js Express Starter Template API',
      version: '1.0.0',
      description: 'Production-oriented Express backend template API documentation',
    },
    servers: [{ url: appConfig.apiUrl }],
  });
}
