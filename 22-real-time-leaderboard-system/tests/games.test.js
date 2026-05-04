// tests/games.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { prisma } from '../src/lib/prisma.js'
import { createAuthUser, authGet, authPost, authPatch, authDelete } from './helpers.js'

let token
let userId
const createdGameIds = []

beforeAll(async () => {
  const auth = await createAuthUser('games')
  token = auth.token
  userId = auth.user.id
})

afterAll(async () => {
  if (createdGameIds.length) {
    await prisma.game.deleteMany({ where: { id: { in: createdGameIds } } })
  }
  await prisma.user.deleteMany({ where: { id: userId } })
  await prisma.$disconnect()
})

describe('GET /games', () => {
  it('returns 200 with paginated data array', async () => {
    const res = await authGet(token, '/games')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body).toHaveProperty('limit')
    expect(res.body).toHaveProperty('offset')
  })

  it('respects ?limit query param', async () => {
    const res = await authGet(token, '/games?limit=2')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeLessThanOrEqual(2)
    expect(res.body.limit).toBe(2)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/games')
    expect(res.status).toBe(401)
  })
})

describe('POST /games', () => {
  it('creates a game and returns 201', async () => {
    const payload = { name: `TestGame_${Date.now()}`, description: 'A test game' }
    const res = await authPost(token, '/games', payload)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe(payload.name)
    createdGameIds.push(res.body.id)
  })

  it('returns 400 for empty name', async () => {
    const res = await authPost(token, '/games', { name: '', description: 'x' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 for missing name', async () => {
    const res = await authPost(token, '/games', { description: 'no name' })
    expect(res.status).toBe(400)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).post('/games').send({ name: 'Unauthorized' })
    expect(res.status).toBe(401)
  })
})

describe('GET /games/:id', () => {
  it('returns 200 for existing game', async () => {
    // Create a game to fetch
    const createRes = await authPost(token, '/games', { name: `FetchMe_${Date.now()}` })
    const gameId = createRes.body.id
    createdGameIds.push(gameId)

    const res = await authGet(token, `/games/${gameId}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(gameId)
  })

  it('returns 404 for non-existent id', async () => {
    const res = await authGet(token, '/games/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

describe('PATCH /games/:id', () => {
  it('partially updates a game and returns 200', async () => {
    const createRes = await authPost(token, '/games', { name: `PatchMe_${Date.now()}` })
    const gameId = createRes.body.id
    createdGameIds.push(gameId)

    const res = await authPatch(token, `/games/${gameId}`, { description: 'Updated desc' })
    expect(res.status).toBe(200)
    expect(res.body.description).toBe('Updated desc')
  })

  it('returns 404 for non-existent game', async () => {
    const res = await authPatch(token, '/games/00000000-0000-0000-0000-000000000000', { name: 'x' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /games/:id', () => {
  it('deletes a game and returns 200', async () => {
    const createRes = await authPost(token, '/games', { name: `DeleteMe_${Date.now()}` })
    const gameId = createRes.body.id

    const res = await authDelete(token, `/games/${gameId}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/deleted/i)

    // Confirm it's gone
    const fetchRes = await authGet(token, `/games/${gameId}`)
    expect(fetchRes.status).toBe(404)
  })

  it('returns 404 for already deleted game', async () => {
    const res = await authDelete(token, '/games/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
