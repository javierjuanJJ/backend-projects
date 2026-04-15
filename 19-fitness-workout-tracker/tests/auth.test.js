// tests/auth.test.js
import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import supertest from 'supertest'
import app from '../src/server/app.js'
import { prisma } from '../src/lib/prisma.js'

const request = supertest(app)
const TEST_EMAIL = 'auth-test@workout.dev'
const TEST_USERNAME = 'auth_testuser'
const TEST_PASSWORD = 'Password123!'

async function cleanupUser() {
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } })
  if (user) {
    await prisma.workout.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
}

describe('Auth API', () => {
  beforeAll(async () => {
    await cleanupUser()
  })

  afterAll(async () => {
    await cleanupUser()
    await prisma.$disconnect()
  })

  // ── POST /api/auth/register ───────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request.post('/api/auth/register').send({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('token')
      expect(res.body.user).toMatchObject({ username: TEST_USERNAME, email: TEST_EMAIL })
      expect(res.body.user).not.toHaveProperty('passwordHash')
    })

    it('should return 409 if email already exists', async () => {
      const res = await request.post('/api/auth/register').send({
        username: 'other_user',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      expect(res.status).toBe(409)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 409 if username already exists', async () => {
      const res = await request.post('/api/auth/register').send({
        username: TEST_USERNAME,
        email: 'other@workout.dev',
        password: TEST_PASSWORD,
      })

      expect(res.status).toBe(409)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 with invalid email', async () => {
      const res = await request.post('/api/auth/register').send({
        username: 'newuser',
        email: 'not-an-email',
        password: TEST_PASSWORD,
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
      expect(res.body.details).toBeInstanceOf(Array)
    })

    it('should return 400 with short password', async () => {
      const res = await request.post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@workout.dev',
        password: '123',
      })

      expect(res.status).toBe(400)
    })

    it('should return 400 with missing fields', async () => {
      const res = await request.post('/api/auth/register').send({ email: TEST_EMAIL })
      expect(res.status).toBe(400)
    })
  })

  // ── POST /api/auth/login ──────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return JWT', async () => {
      const res = await request.post('/api/auth/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('token')
      expect(res.body.user).toMatchObject({ email: TEST_EMAIL })
      expect(res.body.user).not.toHaveProperty('passwordHash')
    })

    it('should return 401 with wrong password', async () => {
      const res = await request.post('/api/auth/login').send({
        email: TEST_EMAIL,
        password: 'WrongPassword!',
      })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 401 with non-existent email', async () => {
      const res = await request.post('/api/auth/login').send({
        email: 'ghost@workout.dev',
        password: TEST_PASSWORD,
      })

      expect(res.status).toBe(401)
    })

    it('should return 400 with invalid email format', async () => {
      const res = await request.post('/api/auth/login').send({
        email: 'not-valid',
        password: TEST_PASSWORD,
      })

      expect(res.status).toBe(400)
    })
  })
})
