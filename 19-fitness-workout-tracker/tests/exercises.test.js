// tests/exercises.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import app from '../src/server/app.js'
import { prisma } from '../src/lib/prisma.js'

const request = supertest(app)

describe('Exercises API', () => {
  let firstExerciseId

  beforeAll(async () => {
    // Los ejercicios vienen del seed — aseguramos que existan
    const count = await prisma.exercise.count()
    if (count === 0) {
      throw new Error('Database not seeded. Run: pnpm prisma db seed')
    }
    const first = await prisma.exercise.findFirst({ orderBy: { name: 'asc' } })
    firstExerciseId = first.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // ── GET /api/exercises ────────────────────────────────────
  describe('GET /api/exercises', () => {
    it('should return a paginated list of exercises', async () => {
      const res = await request.get('/api/exercises')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('total')
      expect(res.body).toHaveProperty('limit')
      expect(res.body).toHaveProperty('offset')
      expect(res.body.data).toBeInstanceOf(Array)
      expect(res.body.data.length).toBeGreaterThan(0)
    })

    it('should respect limit and offset', async () => {
      const res = await request.get('/api/exercises?limit=3&offset=0')
      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeLessThanOrEqual(3)
      expect(res.body.limit).toBe(3)
      expect(res.body.offset).toBe(0)
    })

    it('should filter by category', async () => {
      const res = await request.get('/api/exercises?category=Strength')
      expect(res.status).toBe(200)
      res.body.data.forEach((ex) => {
        expect(ex.category.toLowerCase()).toBe('strength')
      })
    })

    it('should filter by muscleGroup', async () => {
      const res = await request.get('/api/exercises?muscleGroup=Chest')
      expect(res.status).toBe(200)
      res.body.data.forEach((ex) => {
        expect(ex.muscleGroup.toLowerCase()).toBe('chest')
      })
    })

    it('should search by name', async () => {
      const res = await request.get('/api/exercises?search=push')
      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThan(0)
      expect(res.body.data[0].name.toLowerCase()).toContain('push')
    })

    it('should return empty array for non-existent category', async () => {
      const res = await request.get('/api/exercises?category=Nonexistent')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
      expect(res.body.total).toBe(0)
    })
  })

  // ── GET /api/exercises/:id ────────────────────────────────
  describe('GET /api/exercises/:id', () => {
    it('should return a single exercise by id', async () => {
      const res = await request.get(`/api/exercises/${firstExerciseId}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', firstExerciseId)
      expect(res.body).toHaveProperty('name')
      expect(res.body).toHaveProperty('category')
    })

    it('should return 404 for non-existent exercise', async () => {
      const res = await request.get('/api/exercises/00000000-0000-0000-0000-000000000000')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
    })
  })
})
