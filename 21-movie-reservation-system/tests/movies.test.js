// tests/movies.test.js

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import {
  cleanDb, createGenre, createMovie,
  createUserWithToken, createAdminWithToken,
} from './helpers.js'

describe('Movies API', () => {
  let genre
  beforeEach(async () => {
    await cleanDb()
    genre = await createGenre('Acción')
  })

  // ── GET /api/movies ──────────────────────────────────────
  describe('GET /api/movies', () => {
    it('should return paginated list of movies', async () => {
      await createMovie(genre.id, { title: 'Movie A' })
      await createMovie(genre.id, { title: 'Movie B' })

      const res = await request(app).get('/api/movies')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.total).toBe(2)
      expect(res.body.limit).toBeDefined()
      expect(res.body.offset).toBeDefined()
    })

    it('should filter movies by search term', async () => {
      await createMovie(genre.id, { title: 'Avengers' })
      await createMovie(genre.id, { title: 'Titanic' })

      const res = await request(app).get('/api/movies?search=Avengers')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].title).toBe('Avengers')
    })

    it('should not return soft-deleted movies', async () => {
      const movie = await createMovie(genre.id, { title: 'Deleted Movie' })
      const { token } = await createAdminWithToken()

      await request(app)
        .delete(`/api/movies/${movie.id}`)
        .set('Authorization', `Bearer ${token}`)

      const res = await request(app).get('/api/movies')
      expect(res.body.data.every(m => m.id !== movie.id)).toBe(true)
    })

    it('should support pagination with limit and offset', async () => {
      for (let i = 1; i <= 5; i++) {
        await createMovie(genre.id, { title: `Movie ${i}` })
      }

      const res = await request(app).get('/api/movies?limit=2&offset=0')

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.limit).toBe(2)
    })
  })

  // ── GET /api/movies/:id ──────────────────────────────────
  describe('GET /api/movies/:id', () => {
    it('should return a movie by ID with genre', async () => {
      const movie = await createMovie(genre.id, { title: 'Specific Movie' })

      const res = await request(app).get(`/api/movies/${movie.id}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(movie.id)
      expect(res.body.genre).toBeDefined()
    })

    it('should return 404 for non-existent movie', async () => {
      const res = await request(app).get('/api/movies/non-existent-id')
      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/not found/i)
    })
  })

  // ── POST /api/movies ─────────────────────────────────────
  describe('POST /api/movies', () => {
    it('admin should create a movie and return 201', async () => {
      const { token } = await createAdminWithToken()

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Film',
          description: 'Great film',
          durationMinutes: 120,
          genreId: genre.id,
        })

      expect(res.status).toBe(201)
      expect(res.body.title).toBe('New Film')
      expect(res.body.genre).toBeDefined()
    })

    it('regular user should get 403', async () => {
      const { token } = await createUserWithToken()

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Hack', genreId: genre.id, durationMinutes: 90 })

      expect(res.status).toBe(403)
    })

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({ title: 'Hack', genreId: genre.id })

      expect(res.status).toBe(401)
    })

    it('should return 400 with invalid body (Zod)', async () => {
      const { token } = await createAdminWithToken()

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '' }) // título vacío inválido

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation error')
    })
  })

  // ── PUT /api/movies/:id ──────────────────────────────────
  describe('PUT /api/movies/:id', () => {
    it('admin should update a movie completely', async () => {
      const { token } = await createAdminWithToken()
      const movie = await createMovie(genre.id, { title: 'Old Title' })

      const res = await request(app)
        .put(`/api/movies/${movie.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Title', genreId: genre.id, durationMinutes: 90 })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('New Title')
    })

    it('should return 404 for non-existent movie', async () => {
      const { token } = await createAdminWithToken()

      const res = await request(app)
        .put('/api/movies/ghost-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Ghost', genreId: genre.id, durationMinutes: 90 })

      expect(res.status).toBe(404)
    })
  })

  // ── PATCH /api/movies/:id ────────────────────────────────
  describe('PATCH /api/movies/:id', () => {
    it('admin should partially update a movie', async () => {
      const { token } = await createAdminWithToken()
      const movie = await createMovie(genre.id, { title: 'Original' })

      const res = await request(app)
        .patch(`/api/movies/${movie.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Patched Title' })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Patched Title')
    })
  })

  // ── DELETE /api/movies/:id ───────────────────────────────
  describe('DELETE /api/movies/:id', () => {
    it('admin should soft-delete a movie', async () => {
      const { token } = await createAdminWithToken()
      const movie = await createMovie(genre.id)

      const res = await request(app)
        .delete(`/api/movies/${movie.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.message).toMatch(/deleted/i)

      // Verificar que no aparece en listados
      const listRes = await request(app).get('/api/movies')
      expect(listRes.body.data.find(m => m.id === movie.id)).toBeUndefined()
    })

    it('should return 404 for already-deleted movie', async () => {
      const { token } = await createAdminWithToken()
      const movie = await createMovie(genre.id)
      await request(app).delete(`/api/movies/${movie.id}`).set('Authorization', `Bearer ${token}`)

      const res = await request(app)
        .delete(`/api/movies/${movie.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })
})
