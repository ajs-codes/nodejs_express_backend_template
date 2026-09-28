# Architecture

## Style

Classic layered MVC — not a modular monolith.

```text
Routes → Controllers → Services → Repositories → Drizzle ORM → PostgreSQL
```

## Process separation

| Process                     | Responsibility             |
| --------------------------- | -------------------------- |
| API (`server.ts`)           | HTTP REST endpoints        |
| Worker (`worker.ts`)        | BullMQ background jobs     |
| Socket (`socket-server.ts`) | WebSocket real-time events |

All three reuse the same service layer.

## Infrastructure dependencies

- **PostgreSQL** — primary data store
- **Redis** — rate limiting, BullMQ queues, Socket.IO adapter

## Configuration

All environment variables are validated once at startup via Zod in `src/config/env.ts`. Application code reads from typed config modules, never from `process.env` directly.

## Database

Single schema file: `src/db/schema.ts`. Migrations managed by Drizzle Kit in `drizzle/`.

## Authentication model

```text
Passport.js → JWT Strategy → JWT from HttpOnly cookie → Authenticated user
```

Refresh tokens are long-lived, stored hashed in PostgreSQL, and rotated on each refresh.
