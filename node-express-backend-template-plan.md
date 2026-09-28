# Production Node.js + TypeScript Express Backend Template

## 1. Purpose

This repository is a reusable production-oriented backend template for API-only applications.

The template is intentionally a **classic layered MVC architecture**, not a modular monolith.

Primary stack:

- Node.js 24 LTS
- Yarn 4
- TypeScript
- Express 5
- PostgreSQL
- Drizzle ORM
- Zod
- Passport.js + JWT
- Socket.IO
- Redis
- BullMQ
- Nodemailer + Handlebars
- Jest + Supertest
- Swagger/OpenAPI
- Pino
- OpenTelemetry
- Docker + Docker Compose
- PM2
- ESLint + Prettier

The repository should be designed so that an agent can implement the project incrementally through the branch plan at the end of this document.

---

# 2. Architecture Principles

## 2.1 Application style

Use a traditional layered MVC architecture:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Drizzle ORM
  ↓
PostgreSQL
```

Do not introduce a modular-monolith/domain-module architecture.

Keep business logic in services.

Keep database access in repositories.

Keep HTTP concerns in controllers/routes/middleware.

Keep infrastructure configuration in dedicated infrastructure folders.

## 2.2 API-only

The Express application serves JSON APIs.

Do not add:

- EJS
- Pug
- Handlebars as an Express page renderer
- server-rendered HTML pages

Handlebars is used **only for email templates**.

## 2.3 Reuse services

REST controllers and Socket.IO handlers must reuse the same services.

Example:

```text
REST Controller ──────┐
                      ├──> Service
Socket.IO Handler ────┘
                           ↓
                       Repository
```

Do not duplicate business logic between HTTP and WebSocket layers.

---

# 3. Runtime and Package Management

## Runtime

```text
Node.js 24 LTS
```

## Package manager

```text
Yarn 4
```

Use the `packageManager` field in `package.json` to pin the Yarn version.

Use the standard `node_modules` linker rather than Yarn Plug'n'Play for broad compatibility with the Node ecosystem, Jest, Docker, native packages and third-party libraries.

## Language

```text
TypeScript
```

Use:

```text
ESM
NodeNext module resolution
strict TypeScript configuration
```

Development TypeScript execution:

```text
tsx
```

---

# 4. Library Stack

## 4.1 HTTP

```text
express
```

Use Express 5.

Responsibilities:

- HTTP server
- routing
- middleware pipeline
- error handling

---

## 4.2 Validation

```text
zod
```

Use Zod for:

- environment variables
- request body validation
- path parameters
- query parameters
- cookies where appropriate
- JWT/session payload validation where appropriate
- BullMQ job payloads
- external service response validation

Zod schemas should be reusable for TypeScript inference and OpenAPI generation.

---

## 4.3 Database

```text
postgresql
pg
drizzle-orm
drizzle-kit
```

Use PostgreSQL as the only database engine.

Use `pg` / node-postgres as the PostgreSQL driver.

Use Drizzle ORM for database access.

Use Drizzle Kit for migrations.

Database architecture:

```text
Repository
    ↓
Drizzle ORM
    ↓
pg Pool
    ↓
PostgreSQL
```

---

# 5. Database Schema Convention

Do NOT create one schema file per table.

Use one schema file:

```text
src/db/schema.ts
```

Example:

```text
src/
└── db/
    ├── client.ts
    └── schema.ts
```

All Drizzle table definitions belong in `schema.ts`.

Example:

```text
schema.ts
├── users
├── sessions
├── refresh_tokens
└── other tables
```

Keep the file organized with clear sections/comments as it grows.

Do not create:

```text
schema/users.ts
schema/sessions.ts
schema/orders.ts
```

unless the project later becomes large enough to justify splitting it.

---

# 6. Database Migrations

Use Drizzle Kit.

Scripts should include:

```text
yarn db:generate
yarn db:migrate
yarn db:check
yarn db:studio
```

Production migrations must use generated migration files.

Do not use schema push as the production migration mechanism.

Migration workflow:

```text
schema.ts
    ↓
drizzle-kit generate
    ↓
migration SQL
    ↓
drizzle-kit migrate
    ↓
PostgreSQL
```

## Database seeding

Do NOT include a database seeding system in the template.

Test data must be created through test factories instead.

---

# 7. Express Architecture

## Routes

```text
src/routes/
```

Routes define:

- HTTP method
- URL
- middleware chain
- controller handler

Example:

```text
POST /api/auth/login
        ↓
validation middleware
        ↓
auth controller
```

## Controllers

```text
src/controllers/
```

Controllers should be thin.

Responsibilities:

- receive validated request
- call service
- return HTTP response
- map expected service results to HTTP responses

Controllers must not contain:

- SQL
- Drizzle queries
- Redis implementation
- BullMQ implementation
- SMTP logic
- business workflows

## Services

```text
src/services/
```

Services contain:

- business rules
- workflows
- repository orchestration
- transaction orchestration
- queue dispatch
- external-service orchestration
- authentication workflows

## Repositories

```text
src/repositories/
```

Repositories contain database access only.

Example:

```text
user.repository.ts
session.repository.ts
```

Avoid putting business workflows in repositories.

---

# 8. Configuration

Use:

```text
src/config/
```

Recommended files:

```text
src/config/
├── env.ts
├── app.ts
├── auth.ts
├── cors.ts
├── database.ts
├── redis.ts
├── mail.ts
└── websocket.ts
```

## Environment validation

Use Zod to validate environment variables at application startup.

The application should fail fast when required configuration is missing or invalid.

Important variables include:

```text
NODE_ENV
PORT
API_URL

DATABASE_URL

REDIS_URL

JWT_ACCESS_SECRET
JWT_REFRESH_SECRET

COOKIE_NAME
COOKIE_DOMAIN
COOKIE_SECURE
COOKIE_SAME_SITE

CORS_ORIGINS

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
```

Do not scatter direct `process.env.X` usage throughout the application.

Use the validated config layer instead.

---

# 9. Authentication

Use:

```text
passport
passport-jwt
jsonwebtoken
argon2
cookie-parser
```

Authentication model:

```text
Passport.js
    ↓
JWT Strategy
    ↓
JWT extracted from cookie
    ↓
Authenticated user
```

Use Argon2id for password hashing.

Passwords must never be logged or stored in plaintext.

---

# 10. JWT and Session Design

Use short-lived access tokens plus refresh-token-backed sessions.

Recommended conceptual model:

```text
Access Token
    ↓
short-lived JWT
    ↓
HttpOnly cookie

Refresh Token
    ↓
long-lived token
    ↓
HttpOnly cookie
    ↓
database-backed session
```

Refresh tokens should be stored hashed in PostgreSQL.

Support:

- login
- refresh
- logout
- session invalidation
- refresh token rotation
- multiple sessions/devices where appropriate

JavaScript should never need direct access to the JWT.

---

# 11. Cookie Security

Authentication cookies should use:

```text
HttpOnly
Secure
SameSite
Path
Domain where required
```

Configuration must be environment-driven.

Example:

```env
COOKIE_SAME_SITE=lax
COOKIE_SECURE=true
COOKIE_DOMAIN=
```

For a typical deployment:

```text
Frontend:
https://app.example.com

API:
https://api.example.com
```

These are different origins but same-site.

`SameSite=Lax` is the preferred documented default for this architecture.

If frontend/API are genuinely cross-site, support:

```text
SameSite=None
Secure=true
```

when required.

---

# 12. Next.js Frontend Cookie Integration

The backend is designed to work with a Next.js frontend.

Next.js requests should use:

```ts
fetch(url, {
  credentials: "include",
});
```

Express CORS must use explicit origins:

```ts
cors({
  origin: allowedOrigin,
  credentials: true,
});
```

Do NOT use:

```text
Access-Control-Allow-Origin: *
```

with credentialed requests.

---

# 13. CSRF Protection

Because authentication uses cookies, implement CSRF protection.

Use:

```text
csrf-csrf
```

Recommended double-submit-cookie style:

```text
access_token
    HttpOnly
    Secure
    SameSite=Lax

csrf_token
    readable by frontend
    Secure
    SameSite=Lax
```

The frontend sends:

```http
X-CSRF-Token: <token>
```

for state-changing requests.

The API verifies that the CSRF token supplied in the request matches the CSRF cookie.

Protect:

```text
POST
PUT
PATCH
DELETE
```

Safe methods such as GET should not require CSRF validation.

Provide:

```text
GET /api/auth/csrf
```

which establishes/returns the CSRF token for the frontend.

---

# 14. Security Middleware

Use:

```text
helmet
cors
express-rate-limit
rate-limit-redis
redis
csrf-csrf
```

Security layers:

```text
Helmet
    +
CORS
    +
CSRF
    +
Rate Limiting
    +
Secure Cookies
    +
Zod validation
    +
Body size limits
    +
TLS/reverse proxy
```

Use different rate limits for:

- general API
- login
- registration
- password reset
- email verification
- refresh token
- sensitive operations

---

# 15. Redis

Use:

```text
redis
```

Redis is used for:

- BullMQ
- rate limiting
- Socket.IO distributed communication
- future caching
- distributed coordination where needed

Run Redis as a Docker Compose service.

---

# 16. Background Jobs

Use:

```text
bullmq
redis
```

Architecture:

```text
API
 ↓
Service
 ↓
BullMQ Queue
 ↓
Redis
 ↓
Worker
 ↓
Job Processor
```

Do not execute slow email or other background work directly inside HTTP requests.

Use separate worker process/container.

---

# 17. Email

Use:

```text
nodemailer
handlebars
```

Handlebars is the email template engine.

Do NOT use Handlebars for Express page rendering.

Architecture:

```text
Service
 ↓
Mail Queue
 ↓
Redis
 ↓
Mail Worker
 ↓
Handlebars template
 ↓
Nodemailer
 ↓
SMTP
```

Recommended structure:

```text
src/mail/
├── mailer.ts
├── render.ts
├── types.ts
└── templates/
    ├── welcome.hbs
    ├── email-verification.hbs
    └── password-reset.hbs
```

Template variables should be explicitly typed.

Example:

```text
welcome.hbs
    ↓
{
  name,
  verificationUrl
}
    ↓
render HTML
    ↓
Nodemailer
```

Where useful, support plain-text alternatives as well.

Do not put business logic inside Handlebars templates.

---

# 18. Socket.IO

Use:

```text
socket.io
@socket.io/redis-adapter
```

Do not use the low-level `ws` library.

Socket.IO structure:

```text
src/socket/
├── server.ts
├── auth.ts
├── middleware.ts
├── connection.ts
├── handlers/
├── events/
├── rooms/
└── types/
```

Architecture:

```text
Socket.IO connection
    ↓
Socket middleware
    ↓
Authentication
    ↓
Connection handler
    ↓
Event handler
    ↓
Service
```

Socket handlers must reuse existing services.

---

# 19. Socket.IO Authentication

Authenticate Socket.IO connections during the handshake.

Conceptually:

```text
Client
 ↓
Socket.IO connection
 ↓
Socket auth middleware
 ↓
JWT/session verification
 ↓
socket.user
 ↓
Event handlers
```

Do not create a second independent authentication system for WebSockets.

Reuse the existing authentication/token verification infrastructure.

---

# 20. Socket.IO Scaling

Because production may run multiple Node instances:

```text
PM2
 ├── Node instance 1
 ├── Node instance 2
 └── Node instance N
```

Socket.IO must support cross-instance event propagation.

Use:

```text
Socket.IO
+
Redis adapter
+
Redis
```

Keep application-level socket state as stateless as practical.

Configure deployment/load balancing appropriately for Socket.IO connections.

---

# 21. Logging

Use:

```text
pino
pino-http
pino-pretty
```

Log structured JSON in production.

Development can use pretty output.

Every HTTP request should have:

```text
requestId
timestamp
method
route
path
statusCode
durationMs
IP where appropriate
userAgent where appropriate
userId where authenticated
```

Example:

```text
requestId=abc123
method=POST
route=/api/users
status=201
durationMs=47
userId=123
```

Never log:

- passwords
- JWTs
- cookies
- authorization headers
- refresh tokens
- CSRF tokens
- SMTP passwords

---

# 22. Database Logging

Integrate Drizzle query logging with Pino.

Development/debug logging may include:

```text
SQL
parameters
duration
```

Production logging should avoid sensitive values and excessive SQL output.

Prefer structured database operation logs such as:

```text
database=postgres
operation=select-user
durationMs=12
requestId=abc123
```

---

# 23. External Service Logging

Use the same structured logger for:

- PostgreSQL
- Redis
- SMTP
- BullMQ
- external HTTP services
- Socket.IO

Example:

```text
service=email
operation=sendWelcomeEmail
durationMs=183
success=true
requestId=abc123
```

---

# 24. Observability

Use:

```text
@opentelemetry/api
OpenTelemetry Node SDK/instrumentation packages
OTLP exporter
```

The application should remain vendor-neutral.

Support:

```text
logs → Pino
traces → OpenTelemetry
metrics → OpenTelemetry
```

Do not tightly couple the application to a specific vendor.

---

# 25. API Documentation

Use:

```text
@asteasolutions/zod-to-openapi
swagger-ui-express
```

Architecture:

```text
Zod schema
    ↓
OpenAPI schema
    ↓
OpenAPI document
    ↓
Swagger UI
```

The API documentation should be generated from the same validation schemas wherever practical.

Expose Swagger UI through a configurable API documentation route, for example:

```text
/api/docs
```

Do not expose secrets through the OpenAPI document.

---

# 26. Testing

Use:

```text
jest
supertest
```

Testing scope:

```text
API/integration tests
+
real PostgreSQL database changes
```

Do not use SQLite for tests.

Tests must use PostgreSQL so production and test database behavior remain aligned.

Example:

```text
POST /api/users
    ↓
Express
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Drizzle
    ↓
PostgreSQL

Assertions:
HTTP response
+
actual database state
```

---

# 27. Test Database

Use a dedicated PostgreSQL test database/container.

Never run tests against development or production databases.

Test setup should:

```text
start test infrastructure
    ↓
apply migrations
    ↓
run test
    ↓
clean/reset database state
```

Do not add a production database seed system.

---

# 28. Test Factories

Use:

```text
tests/factories/
```

Example:

```text
tests/factories/
├── user.factory.ts
└── session.factory.ts
```

Factories should support overrides.

Examples:

```text
createUser()
createAuthenticatedUser()
createSession()
```

Do not create test fixtures by manually duplicating large object literals in every test.

---

# 29. Test Helpers

Use:

```text
tests/helpers/
├── auth.helper.ts
├── db.helper.ts
└── request.helper.ts
```

These helpers should make API tests concise while still testing the real application stack.

---

# 30. Linting

Use:

```text
eslint
@eslint/js
typescript-eslint
```

Use ESLint flat configuration.

Scripts:

```text
yarn lint
yarn lint:fix
```

---

# 31. Formatting

Use:

```text
prettier
```

Scripts:

```text
yarn format
yarn format:check
```

ESLint handles code quality.

Prettier handles formatting.

---

# 32. Type Checking

Use:

```text
tsc --noEmit
```

Script:

```text
yarn typecheck
```

Build:

```text
yarn build
```

The production build must fail on TypeScript errors.

---

# 33. Dependency Security and Maintenance

Use Yarn's audit functionality because the repository uses Yarn.

Primary commands:

```text
yarn npm audit
yarn npm audit --recursive
```

CI should run a severity threshold, for example:

```text
yarn npm audit --recursive --severity high
```

Do not maintain both `yarn.lock` and `package-lock.json`.

Do not blindly run forced dependency upgrades.

Security workflow:

```text
audit
 ↓
identify vulnerable dependency
 ↓
understand dependency chain
 ↓
upgrade/fix
 ↓
run tests
 ↓
re-audit
```

Also inspect:

```text
yarn outdated
yarn why <package>
```

Treat these separately:

```text
vulnerability
deprecated package
outdated package
```

A package being outdated does not automatically mean it is vulnerable.

---

# 34. Docker

Docker is a first-class part of the project.

Files:

```text
Dockerfile
.dockerignore
compose.yaml
compose.test.yaml
compose.prod.yaml
```

Use a multi-stage Docker build:

```text
dependencies
    ↓
build
    ↓
production runtime
```

Production runtime should:

- contain production dependencies only
- contain compiled JavaScript
- run as a non-root user
- use a minimal appropriate Node image

---

# 35. Docker Development Infrastructure

Development Compose should provide:

```text
postgres
redis
```

The Node application can run locally with `yarn dev`, while infrastructure runs in Docker.

Optionally provide a full Docker development profile later.

PostgreSQL must use a named volume for development persistence.

Redis can initially be ephemeral for development.

---

# 36. Docker Test Infrastructure

Test Compose should provide isolated infrastructure:

```text
postgres-test
redis-test
```

Tests must never connect to development services accidentally.

Use Docker health checks and service readiness handling.

---

# 37. Health Endpoints

Provide:

```text
GET /health/live
GET /health/ready
GET /health
```

## Liveness

Checks that the Node process is alive.

## Readiness

Checks that critical dependencies are available, especially:

```text
PostgreSQL
Redis
```

## Detailed health

May expose internal health information appropriate for operators but must not expose secrets.

---

# 38. Graceful Shutdown

Handle:

```text
SIGTERM
SIGINT
```

Shutdown order:

```text
receive signal
    ↓
stop accepting new requests
    ↓
stop accepting new jobs
    ↓
stop/close Socket.IO gracefully
    ↓
wait for in-flight requests
    ↓
close Redis
    ↓
close PostgreSQL pool
    ↓
exit
```

This is required for Docker, PM2 reloads and production deployments.

---

# 39. PM2

Use PM2 for production process management when deploying to VPS/VM/Docker Compose style infrastructure.

Use:

```text
pm2
pm2-runtime
```

Benefits:

- multiple Node instances
- cluster mode
- graceful reload
- automatic restarts
- memory-based restarts
- process monitoring
- ecosystem configuration

Important:

PM2 is a process manager, not a replacement for a container orchestrator.

If the application later moves to Kubernetes/ECS/etc., running one Node process per container and letting the orchestrator manage replicas may be preferable.

For this reusable template, keep PM2 support.

---

# 40. PM2 Process Separation

Do not run all workloads as one giant process.

Use separate application roles:

```text
API
Worker
Socket.IO
```

Conceptually:

```text
API container
    ↓
PM2 cluster
    ↓
multiple API instances

Worker container
    ↓
PM2 fork mode
    ↓
controlled worker process/concurrency

Socket.IO container
    ↓
PM2/process configuration
    ↓
Socket.IO instances as required
```

Use Redis adapter for Socket.IO cross-instance communication.

---

# 41. PM2 Ecosystem

Create:

```text
ecosystem.config.cjs
```

Define:

```text
api
worker
socket
```

API:

```text
cluster mode
multiple instances
```

Worker:

```text
fork mode
controlled concurrency
```

Socket:

```text
deployment-dependent process configuration
Redis adapter enabled
```

Use `pm2-runtime` inside production containers.

---

# 42. Reverse Proxy

The application should be reverse-proxy agnostic.

Prepare for:

```text
Nginx
Caddy
Cloud Load Balancer
```

Reverse proxy responsibilities may include:

- TLS termination
- HTTP → HTTPS
- WebSocket upgrade
- forwarding headers
- edge-level limits
- load balancing

Express must be configured correctly for trusted proxy behavior when deployed behind a proxy.

---

# 43. Environment Files

Provide:

```text
.env.example
.env.test.example
```

Do not commit real secrets.

Production secrets must be injected by the deployment environment.

---

# 44. Recommended Scripts

The final `package.json` should expose approximately:

```text
Development
yarn dev
yarn dev:worker
yarn dev:socket

Build
yarn build

Production
yarn start
yarn start:worker
yarn start:socket

Quality
yarn lint
yarn lint:fix
yarn format
yarn format:check
yarn typecheck

Testing
yarn test
yarn test:watch
yarn test:coverage
yarn test:ci

Database
yarn db:generate
yarn db:migrate
yarn db:check
yarn db:studio

Security
yarn audit
yarn audit:prod

Validation
yarn validate
yarn security:check

Docker
yarn docker:up
yarn docker:down
yarn docker:logs
yarn docker:ps
yarn docker:reset
```

The exact implementation of each script can be finalized during the foundation branches.

---

# 45. Recommended Validation Workflow

`yarn validate` should run the normal code-quality/test gate:

```text
typecheck
+
lint
+
format:check
+
database schema/migration check
+
tests
```

Security auditing should be a separate command:

```text
yarn security:check
```

CI should run both.

---

# 46. Project Structure

Use this final structure:

```text
project/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── app.ts
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── mail.ts
│   │   └── websocket.ts
│   │
│   ├── db/
│   │   ├── client.ts
│   │   └── schema.ts
│   │
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── session.service.ts
│   │
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   └── session.repository.ts
│   │
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── user.schema.ts
│   │   └── common.schema.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── request-context.middleware.ts
│   │   ├── cors.middleware.ts
│   │   ├── security.middleware.ts
│   │   ├── csrf.middleware.ts
│   │   └── rate-limit.middleware.ts
│   │
│   ├── auth/
│   │   ├── passport.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   │
│   ├── jobs/
│   │   ├── queues/
│   │   │   └── mail.queue.ts
│   │   ├── workers/
│   │   │   └── mail.worker.ts
│   │   └── jobs.ts
│   │
│   ├── mail/
│   │   ├── mailer.ts
│   │   ├── render.ts
│   │   ├── types.ts
│   │   └── templates/
│   │       ├── welcome.hbs
│   │       ├── email-verification.hbs
│   │       └── password-reset.hbs
│   │
│   ├── socket/
│   │   ├── server.ts
│   │   ├── auth.ts
│   │   ├── middleware.ts
│   │   ├── connection.ts
│   │   ├── handlers/
│   │   ├── events/
│   │   ├── rooms/
│   │   └── types/
│   │
│   ├── docs/
│   │   └── openapi.ts
│   │
│   ├── observability/
│   │   ├── logger.ts
│   │   ├── http-logger.ts
│   │   └── telemetry.ts
│   │
│   ├── errors/
│   │   ├── app-error.ts
│   │   └── error-codes.ts
│   │
│   ├── health/
│   │   └── health.controller.ts
│   │
│   ├── lib/
│   │   ├── crypto.ts
│   │   ├── dates.ts
│   │   ├── ids.ts
│   │   └── pagination.ts
│   │
│   ├── app.ts
│   ├── server.ts
│   ├── worker.ts
│   └── socket-server.ts
│
├── tests/
│   ├── setup/
│   │   ├── env.ts
│   │   └── database.ts
│   ├── factories/
│   │   ├── user.factory.ts
│   │   └── session.factory.ts
│   ├── helpers/
│   │   ├── auth.helper.ts
│   │   ├── db.helper.ts
│   │   └── request.helper.ts
│   └── integration/
│       ├── auth/
│       └── users/
│
├── drizzle/
│   └── migration files
│
├── docs/
│   ├── architecture.md
│   ├── development.md
│   ├── deployment.md
│   └── security.md
│
├── Dockerfile
├── .dockerignore
├── compose.yaml
├── compose.test.yaml
├── compose.prod.yaml
├── ecosystem.config.cjs
├── drizzle.config.ts
├── eslint.config.ts
├── jest.config.ts
├── prettier.config.mjs
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── yarn.lock
├── .env.example
└── .env.test.example
```

Do not create `utils/`. Use `lib/` only for genuinely generic cross-cutting helpers that do not have a more specific architectural home.

---

# 47. Branch Implementation Plan

Implement the repository incrementally. Each branch should leave the project in a working state.

Do not implement the entire architecture in one branch.

---

## Branch 01 — Foundation

Branch:

```text
01-foundation
```

Implement:

- initialize Git repository
- Node.js 24 LTS assumptions
- Yarn 4
- package.json
- TypeScript
- ESM
- NodeNext
- strict TypeScript
- tsx
- ESLint
- Prettier
- `.gitignore`
- `.editorconfig`
- basic scripts
- basic README
- `.env.example`

Deliverable:

```text
yarn install
yarn typecheck
yarn lint
yarn format:check
```

all work.

---

## Branch 02 — Express Core

Branch:

```text
02-express-core
```

Implement:

- Express 5
- `src/app.ts`
- `src/server.ts`
- base middleware
- JSON parsing
- request context
- request ID
- centralized error handling
- 404 handling
- basic health endpoint
- graceful shutdown

Deliverable:

```text
yarn dev
```

starts the API successfully.

---

## Branch 03 — Configuration

Branch:

```text
03-config
```

Implement:

- Zod environment schema
- typed configuration
- environment loading
- development/test/production behavior
- configuration modules

Ensure application code does not directly access `process.env` outside the config layer.

---

## Branch 04 — Docker Infrastructure

Branch:

```text
04-docker-infrastructure
```

Implement:

- Dockerfile foundation
- `.dockerignore`
- `compose.yaml`
- PostgreSQL service
- Redis service
- PostgreSQL named volume
- Redis configuration
- health checks
- service readiness

Deliverable:

```text
yarn docker:up
```

starts PostgreSQL and Redis.

---

## Branch 05 — Database

Branch:

```text
05-database
```

Implement:

- `pg`
- Drizzle ORM
- Drizzle Kit
- database client
- connection pool
- `src/db/schema.ts`
- `drizzle.config.ts`
- migrations
- database scripts
- migration checks

Do NOT add database seeding.

Deliverable:

```text
yarn db:generate
yarn db:migrate
yarn db:check
```

work.

---

## Branch 06 — MVC Example

Branch:

```text
06-mvc-example
```

Implement one representative resource, such as users.

Implement:

```text
schema
repository
service
controller
route
Zod validation
```

Example:

```text
POST /api/users
GET /api/users/:id
```

This branch establishes the canonical MVC pattern that all later features must follow.

---

## Branch 07 — Testing

Branch:

```text
07-testing
```

Implement:

- Jest
- Supertest
- test configuration
- test environment
- isolated PostgreSQL test database
- migrations during test setup
- database cleanup/reset helpers
- factories
- request helpers
- integration tests

Tests must verify:

```text
HTTP response
+
database state
```

Do not mock the repository for these API tests.

---

## Branch 08 — Authentication and Security

Branch:

```text
08-auth-security
```

Implement:

- Passport
- passport-jwt
- JWT
- Argon2
- cookie authentication
- access tokens
- refresh tokens
- PostgreSQL-backed sessions
- refresh rotation
- logout/session invalidation
- secure cookie configuration
- CORS
- Helmet
- CSRF
- rate limiting
- Redis-backed rate limiting

Implement:

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET /api/auth/me
GET /api/auth/csrf
```

Verify the full Next.js-compatible cookie flow.

---

## Branch 09 — OpenAPI

Branch:

```text
09-openapi
```

Implement:

- Zod OpenAPI integration
- OpenAPI document generation
- Swagger UI
- `/api/docs`

Use existing Zod schemas rather than duplicating validation definitions.

---

## Branch 10 — Background Jobs and Email

Branch:

```text
10-background-jobs-email
```

Implement:

- BullMQ
- Redis queues
- worker entry point
- mail queue
- Nodemailer
- Handlebars
- email template rendering
- typed email template data
- welcome email
- verification email
- password reset email
- retry behavior
- graceful worker shutdown

Architecture:

```text
Service
 ↓
BullMQ
 ↓
Redis
 ↓
Worker
 ↓
Handlebars
 ↓
Nodemailer
 ↓
SMTP
```

---

## Branch 11 — Socket.IO

Branch:

```text
11-socketio
```

Implement:

- Socket.IO
- Socket.IO server
- authentication middleware
- connection lifecycle
- event handlers
- rooms
- event types
- Redis adapter
- Socket.IO server entry point
- graceful shutdown

Demonstrate one event that calls an existing service.

Do not duplicate business logic in the socket layer.

---

## Branch 12 — Observability

Branch:

```text
12-observability
```

Implement:

- Pino
- pino-http
- request IDs
- structured logging
- response duration
- route logging
- database query logging
- Redis operation logging where useful
- SMTP operation logging
- BullMQ job logging
- Socket.IO connection/event logging
- OpenTelemetry

Ensure secrets are redacted.

---

## Branch 13 — PM2 Production

Branch:

```text
13-pm2-production
```

Implement:

- PM2
- `pm2-runtime`
- `ecosystem.config.cjs`
- API cluster mode
- worker process configuration
- Socket.IO process configuration
- graceful reload
- graceful shutdown
- memory restart configuration
- production Docker integration

Verify:

```text
multiple API instances
```

work correctly.

---

## Branch 14 — Security Audit

Branch:

```text
14-security-audit
```

Implement:

- Yarn audit scripts
- recursive audit
- severity thresholds
- outdated dependency checks
- dependency inspection documentation
- CI security command
- deprecated dependency review workflow

Commands:

```text
yarn audit
yarn audit:prod
yarn security:check
```

Do not introduce `package-lock.json`.

---

## Branch 15 — Production Hardening

Branch:

```text
15-production-hardening
```

Implement:

- production Dockerfile
- `compose.prod.yaml`
- test Compose
- health/readiness checks
- reverse-proxy compatibility
- trusted proxy configuration
- production environment documentation
- deployment documentation
- security documentation
- architecture documentation
- final README
- final example API
- final integration test suite

Verify:

```text
build
start
health
database
Redis
authentication
CSRF
queues
email
Socket.IO
logging
tests
security audit
PM2
Docker
```

---

# 48. Final Definition of Done

The template is complete when a new project can be created from it and provide:

## HTTP

```text
Express 5
REST API
layered MVC
centralized errors
health endpoints
```

## Database

```text
PostgreSQL
Drizzle ORM
Drizzle migrations
single schema.ts
repository layer
```

## Validation

```text
Zod
request validation
environment validation
OpenAPI generation
```

## Authentication

```text
Passport
JWT
HttpOnly cookies
refresh sessions
Argon2
CSRF
CORS
Helmet
rate limiting
```

## Background processing

```text
Redis
BullMQ
worker
Nodemailer
Handlebars email templates
```

## Real-time

```text
Socket.IO
JWT/session authentication
Redis adapter
rooms
event handlers
```

## Testing

```text
Jest
Supertest
real PostgreSQL test DB
factories
API + DB integration tests
```

## Documentation

```text
Swagger UI
OpenAPI
architecture docs
development docs
deployment docs
security docs
```

## Observability

```text
Pino
structured request logs
request IDs
duration
DB logging
service logging
OpenTelemetry
```

## Production

```text
Docker
Docker Compose
PM2
pm2-runtime
multi-instance API
graceful shutdown
health checks
```

## Code quality

```text
ESLint
Prettier
TypeScript
Yarn
dependency audit
deprecated/outdated dependency review
```

The final repository should be suitable as a **GitHub template repository**, where a developer can create a new backend project from it and immediately have a professional foundation without first rebuilding the infrastructure architecture.
