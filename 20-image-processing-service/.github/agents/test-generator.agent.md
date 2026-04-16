---
name: Test Generator
description: >
  Generates vitest + supertest tests for this API. Use when writing tests for
  controllers, models, schemas, middlewares, or services.
model: claude-sonnet-4-5
---

# Test Generator

## Stack: vitest + supertest · Prisma mocked with vi.mock · Sharp mocked

## File locations
- Unit (schemas, services, middlewares): `tests/<layer>/filename.test.js`
- Integration (HTTP endpoints): `tests/integration/<resource>.test.js`

## Required mock pattern for Prisma
```js
vi.mock('../../src/server/lib/prisma.js', () => ({
  default: {
    user:           { findUnique: vi.fn(), create: vi.fn() },
    image:          { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    imageTransform: { create: vi.fn(), update: vi.fn() },
    $transaction:   vi.fn(),
    $queryRaw:      vi.fn().mockResolvedValue([]),
  },
}))
```

## Integration test skeleton
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/server/app.js'
import { generateTestToken, TEST_USER } from '../helpers/auth.js'

const TOKEN = generateTestToken(TEST_USER)

describe('POST /api/resource', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 on success', async () => { ... })
  it('returns 400 on validation error', async () => { ... })
  it('returns 401 without token', async () => { ... })
  it('returns 500 on DB error', async () => { ... })
})
```

## Coverage requirements per endpoint
- ✅ Happy path (200/201/202/204)
- ✅ Validation error (400)
- ✅ Unauthenticated (401)
- ✅ Forbidden (403) when ownership check applies
- ✅ Not found (404)
- ✅ Rate limit (429) for `/transform`
- ✅ Server error (500) via mocked rejection
