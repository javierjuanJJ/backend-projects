/**
 * @file tests/integration/health.test.js
 * @description Integration tests for the health check endpoint.
 */
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import app from '../../src/server/app.js'

vi.mock('../../src/server/lib/prisma.js', () => ({
  default: { $queryRaw: vi.fn() },
}))

import prisma from '../../src/server/lib/prisma.js'

describe('GET /api/health', () => {
  it('returns 200 when database is reachable', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }])

    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('healthy')
    expect(res.body.checks.database).toBe('ok')
  })

  it('returns 503 when database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'))

    const res = await request(app).get('/api/health')
    expect(res.status).toBe(503)
    expect(res.body.status).toBe('degraded')
    expect(res.body.checks.database).toBe('unreachable')
  })
})
