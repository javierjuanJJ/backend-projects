// tests/showtimes.test.js

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import {
  cleanDb, createGenre, createMovie, createRoom,
  createShowtime, createUserWithToken, createAdminWithToken,
} from './helpers.js'

describe('Showtimes API', () => {
  let genre, movie, room

  beforeEach(async () => {
    await cleanDb()
    genre = await createGenre('Sci-Fi')
    movie = await createMovie(genre.id, { title: 'Space Odyssey' })
    room  = await createRoom({ name: 'Sala 1', rows: ['A', 'B', 'C'], seatsPerRow: 5 })
  })

  // ── GET /api/showtimes ───────────────────────────────────
  describe('GET /api/showtimes', () => {
    it('should return upcoming showtimes', async () => {
      await createShowtime(movie.id, room.id)

      const res = await request(app).get('/api/showtimes')

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThan(0)
      expect(res.body.total).toBeDefined()
    })

    it('should filter showtimes by date', async () => {
      const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000)
      await createShowtime(movie.id, room.id, { startTime: tomorrow })

      const dateStr = tomorrow.toISOString().split('T')[0]
      const res = await request(app).get(`/api/showtimes?date=${dateStr}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThan(0)
    })

    it('should filter by movieId', async () => {
      const movie2 = await createMovie(genre.id, { title: 'Other Movie' })
      await createShowtime(movie.id, room.id)
      await createShowtime(movie2.id, room.id)

      const res = await request(app).get(`/api/showtimes?movieId=${movie.id}`)

      expect(res.status).toBe(200)
      expect(res.body.data.every(s => s.movie.id === movie.id)).toBe(true)
    })
  })

  // ── GET /api/showtimes/:id ───────────────────────────────
  describe('GET /api/showtimes/:id', () => {
    it('should return a showtime with movie and room details', async () => {
      const showtime = await createShowtime(movie.id, room.id)

      const res = await request(app).get(`/api/showtimes/${showtime.id}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(showtime.id)
      expect(res.body.movie).toBeDefined()
      expect(res.body.room).toBeDefined()
    })

    it('should return 404 for non-existent showtime', async () => {
      const res = await request(app).get('/api/showtimes/no-such-id')
      expect(res.status).toBe(404)
    })
  })

  // ── GET /api/showtimes/:id/seats ─────────────────────────
  describe('GET /api/showtimes/:id/seats', () => {
    it('should return all seats as available for a new showtime', async () => {
      const showtime = await createShowtime(movie.id, room.id)
      const { token } = await createUserWithToken()

      const res = await request(app)
        .get(`/api/showtimes/${showtime.id}/seats`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.seats).toBeDefined()
      expect(res.body.availableCount).toBe(room.seats.length)
      expect(res.body.seats.every(s => s.available === true)).toBe(true)
    })

    it('should return 401 without authentication', async () => {
      const showtime = await createShowtime(movie.id, room.id)
      const res = await request(app).get(`/api/showtimes/${showtime.id}/seats`)
      expect(res.status).toBe(401)
    })

    it('should return 404 for non-existent showtime', async () => {
      const { token } = await createUserWithToken()
      const res = await request(app)
        .get('/api/showtimes/ghost/seats')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })

  // ── POST /api/showtimes ──────────────────────────────────
  describe('POST /api/showtimes', () => {
    it('admin should create a showtime', async () => {
      const { token } = await createAdminWithToken()
      const futureTime = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

      const res = await request(app)
        .post('/api/showtimes')
        .set('Authorization', `Bearer ${token}`)
        .send({ movieId: movie.id, roomId: room.id, startTime: futureTime, price: 9.5 })

      expect(res.status).toBe(201)
      expect(res.body.movie.id).toBe(movie.id)
      expect(res.body.room.id).toBe(room.id)
    })

    it('should return 400 with past startTime', async () => {
      const { token } = await createAdminWithToken()
      const pastTime = new Date(Date.now() - 1000).toISOString()

      const res = await request(app)
        .post('/api/showtimes')
        .set('Authorization', `Bearer ${token}`)
        .send({ movieId: movie.id, roomId: room.id, startTime: pastTime, price: 9.5 })

      expect(res.status).toBe(400)
    })

    it('regular user should get 403', async () => {
      const { token } = await createUserWithToken()
      const futureTime = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

      const res = await request(app)
        .post('/api/showtimes')
        .set('Authorization', `Bearer ${token}`)
        .send({ movieId: movie.id, roomId: room.id, startTime: futureTime, price: 9.5 })

      expect(res.status).toBe(403)
    })
  })
})
