// tests/helpers.js
// Shared helpers — import in every test file that needs auth or seed data.
import request from 'supertest'
import app from '../app.js'
import { prisma } from '../src/lib/prisma.js'

const UNIQUE = () => Date.now() + Math.random().toString(36).slice(2, 6)

/**
 * Register a throwaway user and return their JWT token + user record.
 * @param {string} [suffix] - optional suffix for uniqueness
 */
export async function createAuthUser(suffix = UNIQUE()) {
  const userData = {
    username: `user_${suffix}`,
    email: `user_${suffix}@test.com`,
    password: 'Test1234!',
  }

  const res = await request(app).post('/auth/register').send(userData)
  if (res.status !== 201) {
    throw new Error(`createAuthUser failed: ${JSON.stringify(res.body)}`)
  }

  return { token: res.body.token, user: res.body.user, password: userData.password }
}

/**
 * Create a game directly via Prisma (for seeding tests).
 */
export async function createGame(name = `Game_${UNIQUE()}`) {
  return prisma.game.create({
    data: { id: crypto.randomUUID(), name, description: 'Test game' },
  })
}

/**
 * Create a score directly via Prisma (for seeding tests).
 */
export async function createScore({ userId, gameId, scoreValue = 1000 }) {
  return prisma.score.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId,
      game_id: gameId,
      score_value: scoreValue,
    },
  })
}

/**
 * Auth helper: GET with Bearer token.
 */
export const authGet = (token, path) =>
  request(app).get(path).set('Authorization', `Bearer ${token}`)

/**
 * Auth helper: POST with Bearer token.
 */
export const authPost = (token, path, body) =>
  request(app).post(path).set('Authorization', `Bearer ${token}`).send(body)

/**
 * Auth helper: PATCH with Bearer token.
 */
export const authPatch = (token, path, body) =>
  request(app).patch(path).set('Authorization', `Bearer ${token}`).send(body)

/**
 * Auth helper: DELETE with Bearer token.
 */
export const authDelete = (token, path) =>
  request(app).delete(path).set('Authorization', `Bearer ${token}`)
