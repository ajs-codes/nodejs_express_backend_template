# Security

## Authentication

- JWT access tokens in HttpOnly cookies (short-lived)
- Refresh tokens in HttpOnly cookies (long-lived, DB-backed, hashed)
- Argon2id password hashing
- Refresh token rotation prevents reuse attacks

## CSRF

Double-submit cookie pattern via `csrf-csrf`:

- `GET /api/auth/csrf` issues a readable CSRF token
- Frontend sends `X-CSRF-Token` header on POST/PUT/PATCH/DELETE
- Login and refresh are exempt (no existing session)

## CORS

Explicit origin allowlist with `credentials: true`. Never use `Access-Control-Allow-Origin: *` with cookies.

## Rate limiting

Redis-backed rate limiters:

| Limiter     | Window | Max |
| ----------- | ------ | --- |
| General API | 15 min | 100 |
| Login       | 15 min | 10  |
| Refresh     | 15 min | 30  |

## Headers

Helmet provides security headers (CSP, HSTS, etc.).

## Logging redaction

Pino redacts: passwords, tokens, cookies, authorization headers, CSRF tokens.

## Dependency security

```bash
yarn security:check    # Audit high+ severity
yarn audit             # Full recursive audit
```

Review workflow: audit → identify → understand chain → upgrade → test → re-audit.

## Cookie configuration

| Setting            | Development | Production                   |
| ------------------ | ----------- | ---------------------------- |
| `COOKIE_SECURE`    | false       | true                         |
| `COOKIE_SAME_SITE` | lax         | lax (or none for cross-site) |
| `COOKIE_DOMAIN`    | empty       | your domain                  |
