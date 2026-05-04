# GitHub Copilot — Leaderboard API

> This file is read automatically by GitHub Copilot in all chat modes.
> More specific rules live in `.github/copilot/instructions/`.

## What this repo is
A REST API for a gaming leaderboard system. Stack: **Next.js + Express · Prisma · MySQL 8 · Redis 7 · JWT · Zod v4 · pnpm · Vitest**.

## Language rule
**JavaScript only (ESM).** Never generate `.ts` or `.tsx` files. Never add TypeScript config.

## File naming
- Controllers: `src/controllers/[resource].js` — class with `static async` methods
- Models: `src/models/[resource].js` — class with `static async` methods, all Prisma logic here
- Routes: `src/routes/[resource].js` — Express Router
- Schemas: `src/schemas/[resource].js` — Zod `validateX` / `validatePartialX` exports
- Tests: `tests/[resource].test.js` — Vitest + Supertest

## Non-negotiable rules
1. IDs → `crypto.randomUUID()` always. Never auto-increment.
2. Zod → always `.safeParse()`, never `.parse()`.
3. Controllers → 404 returns `{ error: 'X not found' }`, no throw.
4. Never expose `password_hash` in any response or select.
5. Prisma client → import singleton from `src/lib/prisma.js`.
6. Redis client → import singleton from `src/lib/redis.js`.
7. JWT secret → `process.env.JWT_SECRET` with try/catch on verify.
8. All list endpoints → support `?limit=N&offset=N` pagination.

## Available agents (use in Copilot Chat)
| Trigger | Agent |
|---|---|
| `@leaderboard-api-architect` | Controllers, models, routes, schemas |
| `@prisma-db-specialist` | Queries, migrations, seeds, cache |
| `@api-tdd-agent` | Vitest + Supertest tests |
| `@devops-deploy-agent` | CI, Docker, Ansible |
