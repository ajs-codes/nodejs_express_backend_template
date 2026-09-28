# AGENT.md — Coding Instructions

This file guides developers and AI agents working on this template. Follow these rules strictly.

---

## Architecture Rules

### Layered MVC (mandatory)

```text
Routes → Controllers → Services → Repositories → Drizzle ORM → PostgreSQL
```


| Layer            | Responsibility                                                | Must NOT contain                    |
| ---------------- | ------------------------------------------------------------- | ----------------------------------- |
| **Routes**       | HTTP method, URL, middleware chain                            | Business logic, SQL                 |
| **Controllers**  | Receive validated request, call service, return HTTP response | SQL, Redis, BullMQ, SMTP, workflows |
| **Services**     | Business rules, orchestration, transactions, queue dispatch   | Direct HTTP concerns                |
| **Repositories** | Database access only                                          | Business workflows                  |


### Do NOT use

- `utils/` folder — use `lib/` for genuinely generic helpers only
- Modular monolith / domain-module architecture
- One schema file per table — all tables go in `src/db/schema.ts`
- Direct `process.env.X` outside `src/config/env.ts`
- Database seeding — use test factories instead
- SQLite for tests — always use real PostgreSQL
- Mocking repositories in integration tests

### Reuse services

REST controllers and Socket.IO handlers **must reuse the same services**. Never duplicate business logic between HTTP and WebSocket layers.

---

## Conventions

### TypeScript & ESM

- `"type": "module"` — use `.js` extension in import paths
- Strict TypeScript — no `any` unless unavoidable
- Use Zod for all validation (env, request body, params, query, job payloads)

### Naming


| Type                | Pattern                     | Example              |
| ------------------- | --------------------------- | -------------------- |
| Files               | kebab-case or dot-separated | `auth.service.ts`    |
| Classes             | PascalCase                  | `AppError`           |
| Functions/variables | camelCase                   | `getCurrentUser`     |
| Constants           | UPPER_SNAKE_CASE            | `QUEUE_NAMES`        |
| DB tables           | snake_case (Drizzle)        | `refresh_token_hash` |


### Error handling

- Throw `AppError` from services for expected errors
- Centralized error middleware maps errors to JSON responses
- Never expose stack traces in production

### Zod-first schemas

Define Zod schemas in `src/schemas/` and reuse them for:

1. Request validation (middleware)
2. TypeScript inference (`z.infer<typeof schema>`)
3. OpenAPI generation (`@asteasolutions/zod-to-openapi`)

---

## Security Rules

### Never log

- Passwords
- JWTs / tokens
- Cookies
- Authorization headers
- Refresh tokens
- CSRF tokens
- SMTP passwords

### Authentication

- JWT in **HttpOnly cookies** — JavaScript must never access tokens directly
- Argon2id for password hashing
- Refresh tokens stored **hashed** in PostgreSQL
- Refresh token rotation on every refresh
- CSRF protection on state-changing requests (POST/PUT/PATCH/DELETE)
- Login and refresh endpoints are CSRF-exempt

### Cookies

```text
access_token  → HttpOnly, Secure (prod), SameSite=Lax
refresh_token → HttpOnly, Secure (prod), SameSite=Lax
csrf_token    → readable by frontend, Secure, SameSite=Lax
```

---

## Feature Workflow Checklist

When adding a new feature:

- Add table definition to `src/db/schema.ts` (with section comment)
- Run `yarn db:generate` then `yarn db:migrate`
- Create repository in `src/repositories/`
- Create service in `src/services/`
- Create Zod schema in `src/schemas/`
- Register schema with OpenAPI in `src/docs/openapi.ts`
- Create controller in `src/controllers/`
- Wire route in `src/routes/`
- Add test factory if needed in `tests/factories/`
- Write integration test in `tests/integration/` (HTTP + DB assertions)
- Run verification commands (below)

---

## Migration Workflow

```text
Edit src/db/schema.ts
    ↓
yarn db:generate
    ↓
Review generated SQL in drizzle/
    ↓
yarn db:migrate
    ↓
yarn db:check
```

- Never use schema push in production
- Never edit applied migration files

---

## Testing Rules

### What to test

- Integration tests with **real PostgreSQL** via `compose.test.yaml`
- Assert both **HTTP response** and **database state**
- Use factories (`tests/factories/`) — no duplicated object literals
- Use helpers (`tests/helpers/`) for auth, DB reset, requests

### What NOT to do

- Mock repositories in API integration tests
- Run tests against dev/production databases
- Use SQLite

### Test infrastructure

```bash
docker compose -f compose.test.yaml up -d --wait
yarn test:ci
docker compose -f compose.test.yaml down -v
```

Test DB: port **5433**, Test Redis: port **6380**

---

## Commands to Run Before Finishing

Run these in order after any code change:

```bash
# 1. Install dependencies
yarn install

# 2. Type check
yarn typecheck

# 3. Lint
yarn lint

# 4. Format check
yarn format:check

# 5. Build
yarn build

# 6. Start dev infrastructure
yarn docker:up

# 7. Apply migrations
yarn db:migrate

# 8. Run tests (with test infrastructure)
docker compose -f compose.test.yaml up -d --wait
yarn test:ci
docker compose -f compose.test.yaml down -v

# 9. Security audit
yarn security:check

# Or run the full gate:
yarn validate
```

---

## Process Architecture

Three separate entry points — do not combine:


| Process   | Entry                  | PM2 Mode |
| --------- | ---------------------- | -------- |
| API       | `src/server.ts`        | cluster  |
| Worker    | `src/worker.ts`        | fork     |
| Socket.IO | `src/socket-server.ts` | fork     |


### Graceful shutdown order

```text
SIGTERM/SIGINT
    ↓
Stop accepting new requests/jobs
    ↓
Close Socket.IO
    ↓
Wait for in-flight work
    ↓
Close Redis
    ↓
Close PostgreSQL pool
    ↓
Exit
```

---

## Background Jobs

- Never execute slow work (email, etc.) inside HTTP request handlers
- Dispatch to BullMQ queue from service layer
- Worker processes jobs separately via `src/worker.ts`
- Validate job payloads with Zod

---

## Email

- Handlebars is for **email templates only** — never for Express page rendering
- Template data must be explicitly typed in `src/mail/types.ts`
- No business logic inside `.hbs` templates

---

## Do NOT List

1. Do not create CRUD endpoints unless explicitly requested
2. Do not add EJS, Pug, or server-rendered HTML
3. Do not scatter `process.env` usage
4. Do not split `schema.ts` into per-table files (unless project grows significantly)
5. Do not add database seeding
6. Do not use `Access-Control-Allow-Origin: `* with credentialed requests
7. Do not maintain both `yarn.lock` and `package-lock.json`
8. Do not blindly run forced dependency upgrades
9. Do not create a second auth system for WebSockets
10. Do not commit real secrets (`.env` files)

