// tests/auth.test.js
import { describe, it, expect, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { prisma } from '../src/lib/prisma.js'

const UNIQUE = Date.now()
const TEST_USER = {
  username: `testauth_${UNIQUE}`,
  email: `testauth_${UNIQUE}@example.com`,
  password: 'Test1234!',
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } })
  await prisma.$disconnect()
})

describe('POST /auth/register', () => {
  it('creates a user and returns 201 with token', async () => {
    const res = await request(app).post('/auth/register').send(TEST_USER)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toMatchObject({
      username: TEST_USER.username,
      email: TEST_USER.email,
    })
    expect(res.body.user).not.toHaveProperty('password_hash')
  })

  it('returns 409 when email already exists', async () => {
    const res = await request(app).post('/auth/register').send(TEST_USER)
    expect(res.status).toBe(409)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 for missing password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'nopass', email: 'nopass@example.com' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid request')
  })

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'bademail', email: 'not-an-email', password: 'Test1234!' })
    expect(res.status).toBe(400)
  })

  it('returns 400 for short password (<8 chars)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'shortpass', email: 'shortpass@example.com', password: '123' })
    expect(res.status).toBe(400)
  })
})

describe('POST /auth/login', () => {
  it('returns 200 with token for valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).not.toHaveProperty('password_hash')
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ghost@example.com', password: 'Test1234!' })
    expect(res.status).toBe(401)
    // Must NOT reveal whether email exists (OWASP A07)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/auth/login').send({})
    expect(res.status).toBe(400)
  })
})
