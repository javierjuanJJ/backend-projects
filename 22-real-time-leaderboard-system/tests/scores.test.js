// tests/scores.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { prisma } from '../src/lib/prisma.js'
import {
  createAuthUser,
  createGame,
  authGet,
  authPost,
  authDelete,
} from './helpers.js'

let token, userId, game, otherToken, otherUserId

beforeAll(async () => {
  const auth = await createAuthUser('scores1')
  token = auth.token
  userId = auth.user.id

  const other = await createAuthUser('scores2')
  otherToken = other.token
  otherUserId = other.user.id

  game = await createGame(`ScoreGame_${Date.now()}`)
})

afterAll(async () => {
  await prisma.score.deleteMany({ where: { game_id: game.id } })
  await prisma.game.delete({ where: { id: game.id } })
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } })
  await prisma.$disconnect()
})

describe('POST /scores', () => {
  it('submits a score and returns 201', async () => {
    const res = await authPost(token, '/scores', {
      game_id: game.id,
      score_value: 9500,
    })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.score_value).toBe(9500)
    expect(res.body.user.id).toBe(userId)
  })

  it('returns 400 for non-positive score_value', async () => {
    const res = await authPost(token, '/scores', { game_id: game.id, score_value: -1 })
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing game_id', async () => {
    const res = await authPost(token, '/scores', { score_value: 100 })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid UUID game_id', async () => {
    const res = await authPost(token, '/scores', { game_id: 'not-a-uuid', score_value: 100 })
    expect(res.status).toBe(400)
  })

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/scores')
      .send({ game_id: game.id, score_value: 100 })
    expect(res.status).toBe(401)
  })
})

describe('GET /scores', () => {
  it('returns 200 with data array', async () => {
    const res = await authGet(token, '/scores')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('filters by gameId query param', async () => {
    const res = await authGet(token, `/scores?gameId=${game.id}`)
    expect(res.status).toBe(200)
    for (const score of res.body.data) {
      expect(score.game.id).toBe(game.id)
    }
  })
})

describe('GET /scores/:id', () => {
  it('returns 404 for non-existent score', async () => {
    const res = await authGet(token, '/scores/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 200 for existing score', async () => {
    const createRes = await authPost(token, '/scores', { game_id: game.id, score_value: 200 })
    const scoreId = createRes.body.id

    const res = await authGet(token, `/scores/${scoreId}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(scoreId)
  })
})

describe('DELETE /scores/:id', () => {
  it('deletes own score and returns 200', async () => {
    const createRes = await authPost(token, '/scores', { game_id: game.id, score_value: 300 })
    const scoreId = createRes.body.id

    const res = await authDelete(token, `/scores/${scoreId}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/deleted/i)
  })

  it('returns 403 when deleting another user\'s score', async () => {
    // token creates a score
    const createRes = await authPost(token, '/scores', { game_id: game.id, score_value: 400 })
    const scoreId = createRes.body.id

    // otherToken tries to delete it
    const res = await authDelete(otherToken, `/scores/${scoreId}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for non-existent score', async () => {
    const res = await authDelete(token, '/scores/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('GET /scores/leaderboard/:gameId', () => {
  beforeAll(async () => {
    // Seed a few scores for the leaderboard
    await authPost(token,      '/scores', { game_id: game.id, score_value: 50000 })
    await authPost(otherToken, '/scores', { game_id: game.id, score_value: 75000 })
    await authPost(token,      '/scores', { game_id: game.id, score_value: 30000 })
  })

  it('returns 200 with ranked data', async () => {
    const res = await authGet(token, `/scores/leaderboard/${game.id}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body).toHaveProperty('period')
    expect(res.body).toHaveProperty('game_id', game.id)

    // Scores should be in descending order
    const scores = res.body.data
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1].score_value).toBeGreaterThanOrEqual(scores[i].score_value)
    }
  })

  it('supports ?period=weekly', async () => {
    const res = await authGet(token, `/scores/leaderboard/${game.id}?period=weekly`)
    expect(res.status).toBe(200)
    expect(res.body.period).toBe('weekly')
  })

  it('supports ?period=daily', async () => {
    const res = await authGet(token, `/scores/leaderboard/${game.id}?period=daily`)
    expect(res.status).toBe(200)
    expect(res.body.period).toBe('daily')
  })

  it('respects ?limit param', async () => {
    const res = await authGet(token, `/scores/leaderboard/${game.id}?limit=1`)
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeLessThanOrEqual(1)
  })

  it('returns 400 for invalid period value', async () => {
    const res = await authGet(token, `/scores/leaderboard/${game.id}?period=invalid`)
    expect(res.status).toBe(400)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/scores/leaderboard/${game.id}`)
    expect(res.status).toBe(401)
  })
})
