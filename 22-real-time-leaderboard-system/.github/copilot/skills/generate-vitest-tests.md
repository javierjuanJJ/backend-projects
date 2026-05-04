# Skill: Generate Vitest Tests

## Purpose
Generate a complete Vitest + Supertest test file for a leaderboard API endpoint.

## When to use
Say: **"Write tests for [resource]"** or **"Generate test file for [endpoint]"**

## Output template

`tests/[resource].test.js`:

```js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { prisma } from '../src/lib/prisma.js'

// --- Seed helpers ---
async function createTestUser() {
  return prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password_hash: '$2b$10$placeholder_hash',
    },
  })
}

async function getAuthToken() {
  const user = await createTestUser()
  const res = await request(app)
    .post('/auth/login')
    .send({ email: user.email, password: 'Test1234!' })
  return { token: res.body.token, user }
}

// --- Tests ---
describe('[Resource] endpoints', () => {
  let token
  let testUser

  beforeAll(async () => {
    const auth = await getAuthToken()
    token = auth.token
    testUser = auth.user
  })

  afterAll(async () => {
    await prisma.[resource].deleteMany({ where: { user_id: testUser.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    await prisma.$disconnect()
  })

  describe('GET /[resource]', () => {
    it('returns 200 with paginated data', async () => {
      const res = await request(app)
        .get('/[resource]')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body).toHaveProperty('limit')
      expect(res.body).toHaveProperty('offset')
    })

    it('returns 401 without token', async () => {
      const res = await request(app).get('/[resource]')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /[resource]/:id', () => {
    it('returns 404 for non-existent id', async () => {
      const res = await request(app)
        .get('/[resource]/non-existent-uuid')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('POST /[resource]', () => {
    it('creates a new resource and returns 201', async () => {
      const payload = {
        // Fill with valid resource fields
      }
      const res = await request(app)
        .post('/[resource]')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
    })

    it('returns 400 for invalid body', async () => {
      const res = await request(app)
        .post('/[resource]')
        .set('Authorization', `Bearer ${token}`)
        .send({})
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('DELETE /[resource]/:id', () => {
    it('returns 404 for non-existent resource', async () => {
      const res = await request(app)
        .delete('/[resource]/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(404)
    })
  })
})
```

## Checklist
- [ ] `beforeAll` seeds required data
- [ ] `afterAll` cleans up all created rows + disconnects prisma
- [ ] Auth token obtained via login, not hardcoded
- [ ] Tests are independent (each creates its own data)
- [ ] Both happy path and error paths covered
- [ ] No `console.log` in tests
