import type { Express } from 'express';
import { api } from './request.helper.js';

export function getSetCookies(headers: Record<string, unknown>): string[] {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return [];
  return Array.isArray(setCookie) ? (setCookie as string[]) : [setCookie as string];
}

export async function getCsrfToken(
  app: Express,
  cookieHeader?: string,
): Promise<{ csrfToken: string; cookies: string[] }> {
  const requestBuilder = api(app).get('/api/auth/csrf');
  if (cookieHeader) {
    requestBuilder.set('Cookie', cookieHeader);
  }
  const response = await requestBuilder;
  const csrfToken = response.body.data.csrfToken as string;
  const cookies = getSetCookies(response.headers);
  return { csrfToken, cookies };
}

export function mergeCookies(existing: string[], incoming: string[]): string {
  const jar = new Map<string, string>();

  for (const cookie of [...existing, ...incoming]) {
    const [pair] = cookie.split(';');
    if (!pair) continue;
    const [name, value] = pair.split('=');
    if (name && value !== undefined) {
      jar.set(name.trim(), value.trim());
    }
  }

  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}
