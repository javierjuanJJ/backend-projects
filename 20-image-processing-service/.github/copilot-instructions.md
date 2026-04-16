# GitHub Copilot Instructions — Image Processing API

## Stack
Next.js 14 + Express · Prisma 5 · PostgreSQL 16 · Sharp 0.33 · RabbitMQ 3.13 · JWT · Zod · pnpm · Vitest

## Project structure
```
src/server/
  controllers/   ← static async methods, try/catch, delegate to model
  middlewares/   ← cors, auth, rateLimiter, upload
  models/        ← Prisma static query methods
  routes/        ← Express Router, validation middleware → controller
  schemas/       ← Zod .safeParse() validators
  services/      ← imageService (Sharp), queueService (RabbitMQ)
  lib/           ← prisma singleton, node-cache wrapper
  docs/          ← swagger.js (OpenAPI 3.0)
tests/
  helpers/       ← generateTestToken
  integration/   ← supertest against app
  schemas/       ← zod unit tests
  services/      ← mocked sharp tests
  middlewares/   ← unit tests
```

## Key conventions
- **JS only** (no TypeScript), ESM (`import/export`)
- Controllers: `try/catch` every method, return proper HTTP status
- Models: always use Prisma `select` to exclude `passwordHash`
- Routes: validate with Zod schema middleware **before** controller
- Schemas: export `validateX(input)` and `validatePartialX(input)`
- HTTP codes: 200 GET · 201 POST · 202 queued · 204 DELETE · 400 validation · 401 unauth · 403 forbidden · 404 not found · 409 conflict · 429 rate limit · 500 error
- Error shape: `{ error: string, details?: array }`
- All `POST /images/:id/transform` → returns **202**, enqueues to RabbitMQ
- Cache with `cacheAside(key, fetcher)` from `lib/cache.js`
- Rate limit with `transformRateLimiter` (per user ID, not IP, when authed)

## OpenAPI
Add `@swagger` JSDoc to every controller method. Spec served at `/api/docs`.
