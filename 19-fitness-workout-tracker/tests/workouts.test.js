// tests/workouts.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import app from '../src/server/app.js'
import { prisma } from '../src/lib/prisma.js'

const request = supertest(app)

const USER_A = { username: 'workout_user_a', email: 'user-a@workout.dev', password: 'Password123!' }
const USER_B = { username: 'workout_user_b', email: 'user-b@workout.dev', password: 'Password123!' }

async function registerAndLogin(userData) {
  // Limpiar si existe
  const existing = await prisma.user.findUnique({ where: { email: userData.email } })
  if (existing) {
    await prisma.workoutDetail.deleteMany({ where: { workout: { userId: existing.id } } })
    await prisma.workout.deleteMany({ where: { userId: existing.id } })
    await prisma.user.delete({ where: { id: existing.id } })
  }

  await request.post('/api/auth/register').send(userData)
  const loginRes = await request.post('/api/auth/login').send({
    email: userData.email,
    password: userData.password,
  })
  return { token: loginRes.body.token, userId: loginRes.body.user.id }
}

describe('Workouts API', () => {
  let tokenA, userIdA
  let tokenB
  let exerciseId
  let workoutId

  beforeAll(async () => {
    ;({ token: tokenA, userId: userIdA } = await registerAndLogin(USER_A))
    ;({ token: tokenB } = await registerAndLogin(USER_B))

    const exercise = await prisma.exercise.findFirst()
    exerciseId = exercise.id
  })

  afterAll(async () => {
    for (const email of [USER_A.email, USER_B.email]) {
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        await prisma.workoutDetail.deleteMany({ where: { workout: { userId: user.id } } })
        await prisma.workout.deleteMany({ where: { userId: user.id } })
        await prisma.user.delete({ where: { id: user.id } })
      }
    }
    await prisma.$disconnect()
  })

  // ── POST /api/workouts ────────────────────────────────────
  describe('POST /api/workouts', () => {
    it('should create a workout with valid data', async () => {
      const res = await request
        .post('/api/workouts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Morning Chest',
          scheduledDate: '2025-07-01T08:00:00.000Z',
          notes: 'Focus on form',
          exercises: [{ exerciseId, sets: 3, reps: 12, weightKg: 50 }],
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toBe('Morning Chest')
      expect(res.body.userId).toBe(userIdA)
      expect(res.body.workoutDetails).toHaveLength(1)
      workoutId = res.body.id
    })

    it('should use default name if not provided', async () => {
      const res = await request
        .post('/api/workouts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          scheduledDate: '2025-07-02T08:00:00.000Z',
          exercises: [{ exerciseId, sets: 2, reps: 10 }],
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Nueva rutina')
    })

    it('should return 401 without token', async () => {
      const res = await request.post('/api/workouts').send({
        scheduledDate: '2025-07-01T08:00:00.000Z',
        exercises: [{ exerciseId, sets: 3, reps: 12 }],
      })
      expect(res.status).toBe(401)
    })

    it('should return 400 if scheduledDate is missing', async () => {
      const res = await request
        .post('/api/workouts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Bad workout', exercises: [{ exerciseId, sets: 3, reps: 12 }] })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })

    it('should return 400 if exercises array is empty', async () => {
      const res = await request
        .post('/api/workouts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ scheduledDate: '2025-07-01T08:00:00.000Z', exercises: [] })

      expect(res.status).toBe(400)
    })

    it('should return 400 with invalid datetime format', async () => {
      const res = await request
        .post('/api/workouts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          scheduledDate: 'not-a-date',
          exercises: [{ exerciseId, sets: 3, reps: 12 }],
        })

      expect(res.status).toBe(400)
    })
  })

  // ── GET /api/workouts ─────────────────────────────────────
  describe('GET /api/workouts', () => {
    it('should list workouts of the authenticated user', async () => {
      const res = await request.get('/api/workouts').set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('total')
      expect(res.body.data).toBeInstanceOf(Array)
      expect(res.body.data.length).toBeGreaterThan(0)
      // Solo devuelve workouts del usuario A
      res.body.data.forEach((w) => expect(w.userId).toBe(userIdA))
    })

    it('should respect limit param', async () => {
      const res = await request.get('/api/workouts?limit=1').set('Authorization', `Bearer ${tokenA}`)
      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeLessThanOrEqual(1)
    })

    it('should filter by completed=false', async () => {
      const res = await request.get('/api/workouts?completed=false').set('Authorization', `Bearer ${tokenA}`)
      expect(res.status).toBe(200)
      res.body.data.forEach((w) => expect(w.isCompleted).toBe(false))
    })

    it('should return 401 without token', async () => {
      const res = await request.get('/api/workouts')
      expect(res.status).toBe(401)
    })

    it('user B should NOT see user A workouts', async () => {
      const res = await request.get('/api/workouts').set('Authorization', `Bearer ${tokenB}`)
      expect(res.status).toBe(200)
      res.body.data.forEach((w) => expect(w.userId).not.toBe(userIdA))
    })
  })

  // ── GET /api/workouts/:id ─────────────────────────────────
  describe('GET /api/workouts/:id', () => {
    it('should return workout by id for its owner', async () => {
      const res = await request
        .get(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(workoutId)
      expect(res.body).toHaveProperty('workoutDetails')
    })

    it('should return 404 for another user\'s workout', async () => {
      const res = await request
        .get(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${tokenB}`)

      expect(res.status).toBe(404)
    })

    it('should return 404 for non-existent workout', async () => {
      const res = await request
        .get('/api/workouts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(404)
    })
  })

  // ── PATCH /api/workouts/:id ───────────────────────────────
  describe('PATCH /api/workouts/:id', () => {
    it('should partially update notes and isCompleted', async () => {
      const res = await request
        .patch(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ notes: 'Great session!', isCompleted: true })

      expect(res.status).toBe(200)
      expect(res.body.notes).toBe('Great session!')
      expect(res.body.isCompleted).toBe(true)
    })

    it('should return 404 when patching another user\'s workout', async () => {
      const res = await request
        .patch(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ notes: 'Hacked!' })

      expect(res.status).toBe(404)
    })
  })

  // ── PUT /api/workouts/:id ─────────────────────────────────
  describe('PUT /api/workouts/:id', () => {
    it('should fully replace a workout', async () => {
      const res = await request
        .put(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Updated Workout',
          scheduledDate: '2025-07-10T10:00:00.000Z',
          notes: 'Replaced',
          exercises: [{ exerciseId, sets: 5, reps: 5, weightKg: 80 }],
        })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Updated Workout')
      expect(res.body.workoutDetails).toHaveLength(1)
      expect(Number(res.body.workoutDetails[0].weightKg)).toBe(80)
    })
  })

  // ── DELETE /api/workouts/:id ──────────────────────────────
  describe('DELETE /api/workouts/:id', () => {
    it('should delete own workout', async () => {
      const res = await request
        .delete(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('message')
    })

    it('should return 404 after deletion', async () => {
      const res = await request
        .delete(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(404)
    })
  })
})
