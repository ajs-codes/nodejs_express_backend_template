# Development Guide

## Setup

```bash
corepack enable
yarn install
cp .env.example .env
cp .env.test.example .env.test
yarn docker:up
yarn db:migrate
yarn dev
```

## Running all processes

In separate terminals:

```bash
yarn dev           # API on :3000
yarn dev:worker    # Mail worker
yarn dev:socket    # Socket.IO on :3001
```

## Database workflow

```bash
# After editing src/db/schema.ts
yarn db:generate
yarn db:migrate
yarn db:check
yarn db:studio     # Optional visual browser
```

## Code quality

```bash
yarn typecheck
yarn lint
yarn lint:fix
yarn format
yarn format:check
```

## Testing

```bash
docker compose -f compose.test.yaml up -d --wait
yarn test
yarn test:watch
yarn test:coverage
docker compose -f compose.test.yaml down -v
```

## Adding a feature

See the checklist in [`AGENT.md`](../AGENT.md#feature-workflow-checklist).
