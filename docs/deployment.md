# Deployment

## Docker Compose (production profile)

```bash
docker compose -f compose.prod.yaml up --build -d
```

Services: API (PM2 cluster), worker, socket, PostgreSQL, Redis.

## PM2 Ecosystem

Configuration in `ecosystem.config.cjs`:

| App    | Mode    | Instances       |
| ------ | ------- | --------------- |
| api    | cluster | max (CPU cores) |
| worker | fork    | 1               |
| socket | fork    | 1               |

```bash
yarn build
pm2-runtime ecosystem.config.cjs
```

## Health checks

| Endpoint            | Purpose                      |
| ------------------- | ---------------------------- |
| `GET /health/live`  | Process alive                |
| `GET /health/ready` | PostgreSQL + Redis available |

Configure your load balancer or orchestrator to use these.

## Reverse proxy

The application is reverse-proxy agnostic (Nginx, Caddy, cloud LB). Set `TRUST_PROXY=true` when deployed behind a proxy.

## Environment

Inject secrets via your deployment platform — never commit `.env` files. Use `.env.example` as reference.

## Graceful shutdown

The API handles `SIGTERM`/`SIGINT` with ordered cleanup: stop accepting requests → close queues → close Redis → close PostgreSQL pool.
