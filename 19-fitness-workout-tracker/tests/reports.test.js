// tests/reports.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import app from '../src/server/app.js'
import { prisma } from '../src/lib/prisma.js'

const request = supertest(app)

const REPORT_USER = { username: 'report_tester', email: 'report-test@workout.dev', password: 'Password123!' }

describe('Reports API', () => {
  let token, userId

  beforeAll(async () => {
    // Limpiar si existe
    const existing = await prisma.user.findUnique({ where: { email: REPORT_USER.email } })
    if (existing) {
      await prisma.workoutDetail.deleteMany({ where: { workout: { userId: existing.id } } })
      await prisma.workout.deleteMany({ where: { userId: existing.id } })
      await prisma.user.delete({ where: { id: existing.id } })
    }

    // Registrar y hacer login
    await request.post('/api/auth/register').send(REPORT_USER)
    const loginRes = await request.post('/api/auth/login').send({
      email: REPORT_USER.email,
      password: REPORT_USER.password,
    })
    token = loginRes.body.token
    userId = loginRes.body.user.id

    // Crear algunos workouts para el reporte
    const exercise = await prisma.exercise.findFirst()
    const exerciseId = exercise.id

    await request
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Workout 1',
        scheduledDate: '2025-06-01T08:00:00.000Z',
        exercises: [{ exerciseId, sets: 3, reps: 10, weightKg: 50 }],
      })

    const w2 = await request
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Workout 2',
        scheduledDate: '2025-06-05T08:00:00.000Z',
        exercises: [{ exerciseId, sets: 4, reps: 8, weightKg: 60 }],
      })

    // Marcar el segundo como completado
    await request
      .patch(`/api/workouts/${w2.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isCompleted: true })
  })

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: REPORT_USER.email } })
    if (user) {
      await prisma.workoutDetail.deleteMany({ where: { workout: { userId: user.id } } })
      await prisma.workout.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
    await prisma.$disconnect()
  })

  // ── GET /api/reports ──────────────────────────────────────
  describe('GET /api/reports', () => {
    it('should return a progress report with summary', async () => {
      const res = await request.get('/api/reports').set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')

      const { summary, workoutsByMonth, mostUsedExercises, recentCompletedWorkouts } = res.body.data

      expect(summary).toHaveProperty('totalWorkouts')
      expect(summary).toHaveProperty('completedWorkouts')
      expect(summary).toHaveProperty('pendingWorkouts')
      expect(summary).toHaveProperty('completionRate')
      expect(summary.totalWorkouts).toBeGreaterThanOrEqual(2)
      expect(summary.completionRate).toBeGreaterThanOrEqual(0)
      expect(summary.completionRate).toBeLessThanOrEqual(100)

      expect(workoutsByMonth).toBeInstanceOf(Array)
      expect(mostUsedExercises).toBeInstanceOf(Array)
      expect(recentCompletedWorkouts).toBeInstanceOf(Array)
    })

    it('should return 401 without token', async () => {
      const res = await request.get('/api/reports')
      expect(res.status).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
      const res = await request
        .get('/api/reports')
        .set('Authorization', 'Bearer invalidtoken123')
      expect(res.status).toBe(401)
    })

    it('should return empty report for user with no workouts', async () => {
      // Crear usuario sin workouts
      const tempUser = { username: 'no_workouts_user', email: 'no-workouts@workout.dev', password: 'Password123!' }
      const existing = await prisma.user.findUnique({ where: { email: tempUser.email } })
      if (existing) await prisma.user.delete({ where: { id: existing.id } })

      await request.post('/api/auth/register').send(tempUser)
      const loginRes = await request.post('/api/auth/login').send({ email: tempUser.email, password: tempUser.password })
      const tempToken = loginRes.body.token
      const tempUserId = loginRes.body.user.id

      const res = await request.get('/api/reports').set('Authorization', `Bearer ${tempToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.summary.totalWorkouts).toBe(0)
      expect(res.body.data.summary.completionRate).toBe(0)

      await prisma.user.delete({ where: { id: tempUserId } })
    })
  })
})
