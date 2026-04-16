/**
 * @file tests/integration/auth.test.js
 * @description Integration tests for authentication endpoints.
 * Prisma is mocked so no real database is needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/server/app.js'

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock('../../src/server/lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

// ── Mock bcrypt (speed up tests) ──────────────────────────────────────────────
vi.mock('bcrypt', () => ({
  default: {
    hash:    vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}))

import prisma from '../../src/server/lib/prisma.js'
import bcrypt from 'bcrypt'

const MOCK_USER = {
  id:           'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email:        'test@example.com',
  passwordHash: 'hashed_password',
  role:         'customer',
  createdAt:    new Date(),
  updatedAt:    new Date(),
}

describe('POST /api/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 with user and token on success', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue(MOCK_USER)

    const res = await request(app)
      .post('/api/register')
      .send({ email: 'test@example.com', password: 'Password1' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.body.user).not.toHaveProperty('passwordHash')
  })

  it('returns 409 when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER)

    const res = await request(app)
      .post('/api/register')
      .send({ email: 'test@example.com', password: 'Password1' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already registered/i)
  })

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'invalid', password: 'Password1' })

    expect(res.status).toBe(400)
  })

  it('returns 400 for weak password', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'test@example.com', password: 'weak' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with token on valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER)
    bcrypt.compare.mockResolvedValue(true)

    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'Password1' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).not.toHaveProperty('passwordHash')
  })

  it('returns 401 when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nobody@example.com', password: 'Password1' })

    expect(res.status).toBe(401)
  })

  it('returns 401 on wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER)
    bcrypt.compare.mockResolvedValue(false)

    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'WrongPass1' })

    expect(res.status).toBe(401)
  })

  it('returns 400 for missing password field', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com' })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer invalid.token.here')
    expect(res.status).toBe(401)
  })
})
