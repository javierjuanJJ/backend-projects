# Leaderboard API — GitHub Copilot Instructions

## Project overview
REST API for a gaming leaderboard system. Built with Next.js custom Express server, Prisma ORM (MySQL), Redis cache, JWT auth, Zod validation. Package manager: **pnpm**.

## Stack
| Layer | Technology |
|---|---|
| Framework | Next.js + Express (custom server) |
| Language | JavaScript (ESM, no TypeScript) |
| ORM | Prisma 6.x |
| Database | MySQL 8 |
| Cache | Redis 7 (ioredis) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod v4 |
| Testing | Vitest + Supertest |
| Containerization | Docker + docker-compose |

## Directory structure
```
.
├── src/
│   ├── controllers/     # HTTP handlers — static class, thin layer
│   ├── models/          # Prisma queries — all DB logic
│   ├── routes/          # Express Router files
│   ├── schemas/         # Zod schemas
│   ├── middlewares/     # cors, auth, errorHandler
│   └── lib/
│       ├── prisma.js    # Prisma client singleton
│       └── redis.js     # ioredis client singleton
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── tests/               # Vitest + Supertest tests
├── app.js               # Express app (no listen when NODE_ENV set)
├── server.js            # Entry point (calls app.listen)
└── config.js            # DEFAULTS constants
```

## Code conventions

### Always
- Use `static async` methods in Controller and Model classes
- IDs: `crypto.randomUUID()` — Prisma schema uses `@default(uuid())`
- Return `{ error: string }` on 4xx, never throw to the client
- Use `safeParse()` from Zod, never `parse()`
- Prisma singleton: import from `src/lib/prisma.js`
- Never commit `.env` — use `.env.example` as template

### Never
- TypeScript files (`.ts`, `.tsx`)
- `auto_increment` IDs
- Hardcoded secrets or origins
- `console.log` in production paths — use structured logging

## API resource conventions
- `GET /resource` → list with `?limit=10&offset=0`
- `GET /resource/:id` → single or 404
- `POST /resource` → 201 with created object
- `PATCH /resource/:id` → partial update, 200
- `PUT /resource/:id` → full update, 200
- `DELETE /resource/:id` → 200 with message

## Auth
- All routes except `/auth/*` and `GET /health` require `Authorization: Bearer <token>`
- Token payload: `{ userId, username, iat, exp }`
- Token expiry: `7d`

## Redis caching
- Leaderboard queries cached with key pattern: `leaderboard:<gameId>:<period>:<limit>`
- TTL: 60 seconds
- Invalidate on score write: delete all `leaderboard:*` keys for that game
