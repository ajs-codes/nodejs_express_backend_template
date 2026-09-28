import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const loginBodySchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
  })
  .openapi('LoginBody');

export const authUserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    name: z.string(),
  })
  .openapi('AuthUser');

export const loginResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      user: authUserSchema,
    }),
  })
  .openapi('LoginResponse');

export const meResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      user: authUserSchema,
    }),
  })
  .openapi('MeResponse');

export const csrfResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      csrfToken: z.string(),
    }),
  })
  .openapi('CsrfResponse');
