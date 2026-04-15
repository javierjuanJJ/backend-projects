# vitest-test-generator.agent.md
# GitHub Copilot Agent — Generador de Tests Vitest para Workout Tracker

---
name: Vitest Test Generator — Workout Tracker
description: >
  Genera tests completos con Vitest y supertest para la API de Workout Tracker.
  Cubre happy path, casos de error, autenticación y autorización.

model: gpt-4o

---

## Propósito

Generas tests de integración y unitarios para la API de Workout Tracker usando **Vitest** y **supertest**. Cada test suite cubre completamente un recurso de la API.

## Estructura base de un test suite

```js
// tests/workouts.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import app from '../src/server/app.js'
import { prisma } from '../src/lib/prisma.js'

const request = supertest(app)

describe('Workouts API', () => {
  let authToken
  let userId
  let workoutId

  // ── Setup: crear usuario y obtener token ──────────────
  beforeAll(async () => {
    // Limpiar datos de test previos
    await prisma.workoutDetail.deleteMany({ where: { workout: { user: { email: 'test@workout.dev' } } } })
    await prisma.workout.deleteMany({ where: { user: { email: 'test@workout.dev' } } })
    await prisma.user.deleteMany({ where: { email: 'test@workout.dev' } })

    // Registrar usuario de test
    const registerRes = await request
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@workout.dev', password: 'Password123!' })
    expect(registerRes.status).toBe(201)

    // Login para obtener JWT
    const loginRes = await request
      .post('/api/auth/login')
      .send({ email: 'test@workout.dev', password: 'Password123!' })
    expect(loginRes.status).toBe(200)
    authToken = loginRes.body.token
    userId = loginRes.body.user.id
  })

  afterAll(async () => {
    await prisma.workoutDetail.deleteMany({ where: { workout: { userId } } })
    await prisma.workout.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  // ── POST /api/workouts ────────────────────────────────
  describe('POST /api/workouts', () => {
    it('should create a workout with valid data', async () => {
      const exercises = await prisma.exercise.findMany({ take: 2 })
      const res = await request
        .post('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Morning Routine',
          scheduledDate: '2025-06-20T08:00:00.000Z',
          exercises: [
            { exerciseId: exercises[0].id, sets: 3, reps: 12, weightKg: 50 }
          ]
        })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toBe('Morning Routine')
      workoutId = res.body.id
    })

    it('should return 401 without token', async () => {
      const res = await request.post('/api/workouts').send({ name: 'Test' })
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 with missing required fields', async () => {
      const res = await request
        .post('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Invalid' }) // falta scheduledDate y exercises
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Validation failed')
      expect(res.body.details).toBeInstanceOf(Array)
    })
  })

  // ── GET /api/workouts ─────────────────────────────────
  describe('GET /api/workouts', () => {
    it('should list user workouts', async () => {
      const res = await request
        .get('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('total')
      expect(res.body.data).toBeInstanceOf(Array)
    })

    it('should return 401 without token', async () => {
      const res = await request.get('/api/workouts')
      expect(res.status).toBe(401)
    })
  })

  // ── GET /api/workouts/:id ─────────────────────────────
  describe('GET /api/workouts/:id', () => {
    it('should get workout by id', async () => {
      const res = await request
        .get(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body.id).toBe(workoutId)
    })

    it('should return 404 for non-existent workout', async () => {
      const res = await request
        .get('/api/workouts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })
  })

  // ── PATCH /api/workouts/:id ───────────────────────────
  describe('PATCH /api/workouts/:id', () => {
    it('should partially update a workout', async () => {
      const res = await request
        .patch(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Updated notes', isCompleted: true })
      expect(res.status).toBe(200)
      expect(res.body.notes).toBe('Updated notes')
      expect(res.body.isCompleted).toBe(true)
    })
  })

  // ── DELETE /api/workouts/:id ──────────────────────────
  describe('DELETE /api/workouts/:id', () => {
    it('should delete a workout', async () => {
      const res = await request
        .delete(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
    })

    it('should return 404 for already deleted workout', async () => {
      const res = await request
        .delete(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })
  })
})
```

## Reglas de generación de tests

1. **Siempre** usar `beforeAll` para setup (no `beforeEach` para operaciones costosas)
2. **Siempre** limpiar datos en `afterAll` para no contaminar otros tests
3. **Verificar ownership**: crear un segundo usuario y comprobar que no puede acceder a recursos del primero (403)
4. **Testear paginación**: pasar `?limit=2&offset=0` y verificar estructura de respuesta
5. **No hardcodear IDs** de ejercicios — buscarlos en la DB con `prisma.exercise.findMany({ take: 1 })`
6. **Testear formatos de fecha inválidos** en campos `scheduledDate`
7. Cada test debe ser **independiente** y no depender del orden de ejecución (excepto el setup inicial)
