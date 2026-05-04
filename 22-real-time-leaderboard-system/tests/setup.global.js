// tests/setup.global.js
// Runs once before all test suites (globalSetup in vitest.config.js)
// Verifies infra connectivity before wasting time on 50 test failures.

import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

export async function setup() {
  // ─── Validate required env vars ─────────────────────────────────────────
  const required = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    throw new Error(
      `[Test setup] Missing required env vars: ${missing.join(', ')}\n` +
      'Copy .env.example → .env.test and fill in values.'
    )
  }

  // ─── Check MySQL connection ──────────────────────────────────────────────
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    console.log('[Test setup] ✓ MySQL connected')
  } catch (e) {
    throw new Error(`[Test setup] MySQL connection failed: ${e.message}`)
  } finally {
    await prisma.$disconnect()
  }

  // ─── Check Redis connection ──────────────────────────────────────────────
  const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true })
  try {
    await redis.connect()
    await redis.ping()
    console.log('[Test setup] ✓ Redis connected')
  } catch (e) {
    throw new Error(`[Test setup] Redis connection failed: ${e.message}`)
  } finally {
    redis.disconnect()
  }
}

export async function teardown() {
  // Global cleanup if needed after all suites finish
  console.log('[Test setup] ✓ Teardown complete')
}
