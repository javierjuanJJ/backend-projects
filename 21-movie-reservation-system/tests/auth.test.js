// tests/auth.test.js

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { cleanDb, createUser } from './helpers.js'

describe('Auth API', () => {
  beforeEach(async () => { await cleanDb() })

  // ── POST /api/auth/register ──────────────────────────────
  describe('POST /api/auth/register', () => {
    const validPayload = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    }

    it('should register a new user and return 201 with tokens', async () => {
      const res = await request(app).post('/api/auth/register').send(validPayload)

      expect(res.status).toBe(201)
      expect(res.body.user).toMatchObject({ email: validPayload.email, role: 'user' })
      expect(res.body.user.password).toBeUndefined()
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
    })

    it('should return 409 when email already exists', async () => {
      await request(app).post('/api/auth/register').send(validPayload)
      const res = await request(app).post('/api/auth/register').send(validPayload)

      expect(res.status).toBe(409)
      expect(res.body.error).toMatch(/already exists/i)
    })

    it('should return 400 with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, email: 'not-an-email' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation error')
    })

    it('should return 400 with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validPayload, password: '123' })

      expect(res.status).toBe(400)
    })

    it('should return 400 when username is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'Password123!' })

      expect(res.status).toBe(400)
    })
  })

  // ── POST /api/auth/login ─────────────────────────────────
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createUser({ email: 'login@test.com', password: 'Login1234!' })
    })

    it('should login successfully and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'Login1234!' })

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
      expect(res.body.user.email).toBe('login@test.com')
      expect(res.body.user.password).toBeUndefined()
    })

    it('should return 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'WrongPass1!' })

      expect(res.status).toBe(401)
      expect(res.body.error).toMatch(/invalid credentials/i)
    })

    it('should return 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'Login1234!' })

      expect(res.status).toBe(401)
    })

    it('should return 400 with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'badformat', password: 'Login1234!' })

      expect(res.status).toBe(400)
    })
  })

  // ── POST /api/auth/refresh ───────────────────────────────
  describe('POST /api/auth/refresh', () => {
    it('should return a new access token with valid refresh token', async () => {
      await createUser({ email: 'refresh@test.com', password: 'Test1234!' })
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'refresh@test.com', password: 'Test1234!' })

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
    })

    it('should return 401 with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })

      expect(res.status).toBe(401)
    })
  })

  // ── GET /api/auth/me ─────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return current user data', async () => {
      await createUser({ email: 'me@test.com', password: 'Test1234!' })
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'me@test.com', password: 'Test1234!' })

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.email).toBe('me@test.com')
      expect(res.body.password).toBeUndefined()
    })

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
    })
  })
})
