# 🖼️ Image Processing API

> Production-ready REST API for image upload, transformation and retrieval — built with **Next.js + Express**, **Prisma**, **Sharp** and **RabbitMQ**.

[![CI/CD](https://github.com/YOUR_ORG/image-processing-api/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_ORG/image-processing-api/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange.svg)](https://pnpm.io)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [API Reference](#api-reference)
- [Image Transformations](#image-transformations)
- [Authentication](#authentication)
- [Testing](#testing)
- [Deployment](#deployment)
- [GitHub Copilot Integration](#github-copilot-integration)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Features

| Feature | Details |
|---|---|
| **Auth** | Register / login · JWT (HS256) · role-based (`customer`, `admin`) |
| **Image Upload** | Multipart form-data · JPEG, PNG, WebP, AVIF, GIF, TIFF |
| **Async Transforms** | Queued via RabbitMQ, processed by Sharp |
| **Transformations** | Resize, crop, rotate, flip, mirror, compress, format convert, grayscale, sepia, watermark |
| **Blurhash** | Auto-generated on upload for lazy-loading placeholders |
| **Color Palette** | Dominant color extracted on upload |
| **Pagination** | All list endpoints paginated with `page` + `limit` |
| **Rate Limiting** | 20 transform requests / 15 min per user |
| **Caching** | In-memory metadata cache with configurable TTL |
| **OpenAPI Docs** | Auto-generated Swagger UI at `/api/docs` |
| **E-commerce** | Products, categories, cart, Stripe-ready orders |
| **Observability** | Health check endpoint, structured logging |

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐
│   Client    │────▶│  Nginx (reverse proxy + static files)    │
└─────────────┘     └──────────────┬───────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────┐
                    │  Next.js + Express API (Node 20)         │
                    │  ├── /api/auth     (JWT auth)            │
                    │  ├── /api/images   (upload + transform)  │
                    │  ├── /api/products (catalogue + cart)    │
                    │  └── /api/health   (health check)        │
                    └──────┬──────────────┬─────────────────────┘
                           │              │
              ┌────────────▼──┐    ┌──────▼──────────────┐
              │  PostgreSQL   │    │  RabbitMQ            │
              │  (Prisma ORM) │    │  queue: image_       │
              └───────────────┘    │  transforms          │
                                   └──────────────────────┘
                                          │ consumer
                                   ┌──────▼──────────────┐
                                   │  Sharp processor     │
                                   │  (same process)      │
                                   └──────────────────────┘
```

**Transform flow:**
1. `POST /api/images/:id/transform` validates payload and returns **202 Accepted** immediately
2. A job is published to the `image_transforms` RabbitMQ queue
3. The Sharp consumer processes the job asynchronously and updates the `image_transforms` DB record
4. The client polls `GET /api/images/:id` to check `transformations[0].status`

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2
- [pnpm](https://pnpm.io/installation) 9+
- [Node.js](https://nodejs.org) 20 LTS

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_ORG/image-processing-api.git
cd image-processing-api

cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and POSTGRES_PASSWORD
```

### 2. Start all services

```bash
docker compose up -d
```

### 3. Run database migrations

```bash
docker compose exec api pnpm prisma:deploy
```

### 4. Verify the API is running

```bash
curl http://localhost:3000/api/health
# {"status":"healthy","checks":{"api":"ok","database":"ok"}}
```

### 5. Open the interactive docs

```
http://localhost:3000/api/docs
```

---

## Development Setup

Running outside Docker for faster iteration:

```bash
# 1. Start only the infrastructure services
docker compose up -d postgres rabbitmq

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client and run migrations
pnpm prisma:generate
pnpm prisma:migrate

# 4. Start the dev server (with hot reload via Next.js)
pnpm dev
```

The API will be at `http://localhost:3000` and Prisma Studio at:

```bash
pnpm prisma:studio   # http://localhost:5555
```

---

## API Reference

All endpoints return JSON. Protected endpoints require `Authorization: Bearer <token>`.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/register` | — | Create account · returns `{ user, token }` |
| `POST` | `/api/login` | — | Login · returns `{ user, token }` |
| `GET` | `/api/me` | ✅ | Current user profile |

### Images

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/images` | ✅ | Upload an image (multipart `image` field) |
| `GET` | `/api/images` | ✅ | List images (paginated) |
| `GET` | `/api/images/:id` | ✅ | Image detail + transform history |
| `POST` | `/api/images/:id/transform` | ✅ | Queue a transformation (202) |
| `DELETE` | `/api/images/:id` | ✅ | Delete image and file |

### Products & Cart

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | — | List products (paginated, filterable) |
| `GET` | `/api/products/:id` | — | Product detail |
| `POST` | `/api/products` | 🔐 admin | Create product |
| `PATCH` | `/api/products/:id` | 🔐 admin | Update product |
| `DELETE` | `/api/products/:id` | 🔐 admin | Soft-delete product |
| `GET` | `/api/products/cart` | ✅ | View cart |
| `POST` | `/api/products/cart` | ✅ | Add / update cart item |
| `DELETE` | `/api/products/cart/:productId` | ✅ | Remove cart item |

### System

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Database + API health check |
| `GET` | `/api/docs` | Interactive Swagger UI |
| `GET` | `/api/docs.json` | Raw OpenAPI 3.0 spec |

---

## Image Transformations

Send a `POST /api/images/:id/transform` with this payload:

```json
{
  "transformations": {
    "resize":    { "width": 800, "height": 600 },
    "crop":      { "width": 400, "height": 400, "x": 100, "y": 50 },
    "rotate":    90,
    "flip":      false,
    "mirror":    false,
    "compress":  85,
    "format":    "webp",
    "filters":   { "grayscale": false, "sepia": true },
    "watermark": { "text": "© My Brand", "opacity": 0.6 }
  }
}
```

All fields are **optional** — combine any you need. At least one must be present.

**Supported output formats:** `jpeg` · `png` · `webp` · `avif` · `tiff`

The response is `202 Accepted`:

```json
{
  "message": "Transformation queued",
  "transformId": "uuid",
  "status": "pending"
}
```

Poll `GET /api/images/:id` and check `transformations[0].status` → `pending | processing | done | failed`.
When `done`, the `outputUrl` field contains the transformed image URL.

---

## Authentication

### Register

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@example.com", "password": "SecurePass1" }'
```

Password requirements: ≥ 8 chars · at least one uppercase · at least one number.

### Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@example.com", "password": "SecurePass1" }'
```

Both endpoints return:

```json
{
  "user":  { "id": "uuid", "email": "user@example.com", "role": "customer" },
  "token": "eyJhbGci..."
}
```

Use the token in subsequent requests:

```bash
curl http://localhost:3000/api/images \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## Testing

```bash
# Run all tests once
pnpm test

# Watch mode during development
pnpm test:watch

# With coverage report (threshold: 80%)
pnpm test:coverage
```

Coverage report is generated at `coverage/index.html`.

### Test structure

```
tests/
  setup.js                      ← Global env vars + mocks
  helpers/auth.js               ← generateTestToken, TEST_USER, TEST_ADMIN
  schemas/
    auth.test.js                ← Zod schema unit tests
    images.test.js
  middlewares/
    auth.test.js                ← JWT middleware unit tests
  services/
    imageService.test.js        ← Sharp (mocked) unit tests
  integration/
    health.test.js
    auth.test.js                ← Register/login/me supertest
    images.test.js              ← Upload/list/transform/delete supertest
```

Prisma is fully mocked — no database required to run tests.

---

## Deployment

### GitHub Actions (automatic)

Every push to `main` triggers:

1. **Lint** — ESLint
2. **Test** — vitest with real Postgres + RabbitMQ service containers
3. **Build** — Docker image pushed to GHCR
4. **Deploy** — SSH pull + restart on your server

**Required GitHub secrets** (`Settings → Secrets and variables → Actions`):

| Secret | Description |
|---|---|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH username (e.g. `ubuntu`) |
| `DEPLOY_SSH_KEY` | Private SSH key (the public key must be in `~/.ssh/authorized_keys` on the server) |

### Ansible (manual / first deploy)

```bash
# 1. Copy and fill in secrets
cp deploy/ansible/vars/secrets.yml.example deploy/ansible/vars/secrets.yml
ansible-vault encrypt deploy/ansible/vars/secrets.yml

# 2. Edit inventory with your server IP
vim deploy/ansible/inventory.ini

# 3. Run the playbook
ansible-playbook deploy/ansible/playbook.yml \
  -i deploy/ansible/inventory.ini \
  --ask-vault-pass
```

The playbook will: install Docker, create the app user, deploy config files, pull the image, run migrations, configure UFW, and verify the health check.

### Manual deploy on server

```bash
cd /opt/image-processing-api
docker compose pull
docker compose up -d
docker compose exec api pnpm prisma:deploy
```

---

## GitHub Copilot Integration

This project ships with Copilot agent and skill definitions under `.github/`:

| File | Purpose |
|---|---|
| `copilot-instructions.md` | Global project context loaded automatically |
| `agents/api-architect.agent.md` | Generates complete endpoint sets |
| `agents/test-generator.agent.md` | Generates vitest + supertest tests |
| `skills/sharp-transform.md` | Sharp pipeline patterns |
| `skills/prisma-model.md` | Prisma static class patterns |

**Usage in VS Code:** open GitHub Copilot Chat and type `@api-architect add a DELETE /api/cart endpoint` or `@test-generator write tests for the products controller`.

---

## Environment Variables

See [`.env.example`](.env.example) for the full annotated list.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Min 32-char random string |
| `JWT_EXPIRES_IN` | | `7d` | Token expiry |
| `RABBITMQ_URL` | ✅ | — | `amqp://user:pass@host:5672` |
| `UPLOAD_DIR` | | `./uploads` | Image storage path |
| `CACHE_DIR` | | `./cache` | Transformed image path |
| `MAX_FILE_SIZE_MB` | | `10` | Upload limit |
| `RATE_LIMIT_MAX` | | `20` | Max transform requests / window |
| `RATE_LIMIT_WINDOW_MS` | | `900000` | Rate limit window (15 min) |
| `CORS_ALLOWED_ORIGINS` | | — | Comma-separated origins |
| `STRIPE_SECRET_KEY` | | — | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | | — | Stripe webhook signing secret |

---

## Project Structure

```
image-processing-api/
├── .github/
│   ├── copilot-instructions.md      ← Copilot global context
│   ├── agents/                      ← Copilot custom agents
│   ├── skills/                      ← Copilot skill definitions
│   └── workflows/
│       └── ci-cd.yml                ← GitHub Actions pipeline
├── deploy/
│   └── ansible/                     ← Ansible deployment playbook
├── nginx/
│   └── conf.d/default.conf          ← Nginx reverse proxy config
├── prisma/
│   └── schema.prisma                ← Database schema (all models)
├── src/
│   └── server/
│       ├── app.js                   ← Express app factory
│       ├── config.js                ← Constants and defaults
│       ├── controllers/             ← Request handlers
│       ├── docs/swagger.js          ← OpenAPI setup
│       ├── lib/                     ← Prisma singleton, cache
│       ├── middlewares/             ← auth, cors, rateLimit, upload
│       ├── models/                  ← Prisma query classes
│       ├── routes/                  ← Express routers
│       ├── schemas/                 ← Zod validators
│       └── services/                ← imageService, queueService
├── tests/
│   ├── helpers/auth.js
│   ├── integration/
│   ├── middlewares/
│   ├── schemas/
│   ├── services/
│   └── setup.js
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── next.config.js
├── package.json
├── server.js                        ← Entry point
└── vitest.config.js
```

---

## License

MIT — see [LICENSE](LICENSE)
