// tests/admin.test.js

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import {
  cleanDb, createGenre, createMovie, createRoom,
  createShowtime, createUserWithToken, createAdminWithToken,
} from './helpers.js'

describe('Admin API', () => {
  beforeEach(async () => { await cleanDb() })

  // ── GET /api/admin/users ─────────────────────────────────
  describe('GET /api/admin/users', () => {
    it('admin should list all users', async () => {
      const { token } = await createAdminWithToken()
      await createUserWithToken({ email: 'u1@test.com' })
      await createUserWithToken({ email: 'u2@test.com' })

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThanOrEqual(3) // admin + 2 users
      expect(res.body.data.every(u => u.password === undefined)).toBe(true)
    })

    it('regular user should get 403', async () => {
      const { token } = await createUserWithToken()
      const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(403)
    })
  })

  // ── PATCH /api/admin/users/:id/promote ───────────────────
  describe('PATCH /api/admin/users/:id/promote', () => {
    it('admin should promote a regular user to admin', async () => {
      const { token: adminToken } = await createAdminWithToken()
      const { user } = await createUserWithToken({ email: 'promote@test.com' })

      const res = await request(app)
        .patch(`/api/admin/users/${user.id}/promote`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.user.role).toBe('admin')
    })

    it('should return 409 when promoting an already admin user', async () => {
      const { token, user } = await createAdminWithToken()

      const res = await request(app)
        .patch(`/api/admin/users/${user.id}/promote`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(409)
    })
  })

  // ── GET /api/admin/reservations ──────────────────────────
  describe('GET /api/admin/reservations', () => {
    it('admin should see all reservations', async () => {
      const genre = await createGenre()
      const movie = await createMovie(genre.id)
      const room = await createRoom()
      const showtime = await createShowtime(movie.id, room.id)
      const { token: adminToken } = await createAdminWithToken()
      const { token: userToken } = await createUserWithToken({ email: 'reserver@test.com' })

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ showtimeId: showtime.id, seatIds: [room.seats[0].id] })

      const res = await request(app)
        .get('/api/admin/reservations')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThan(0)
    })
  })

  // ── GET /api/admin/reports/stats ─────────────────────────
  describe('GET /api/admin/reports/stats', () => {
    it('admin should get revenue and occupancy stats', async () => {
      const { token } = await createAdminWithToken()

      const res = await request(app)
        .get('/api/admin/reports/stats')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.revenue).toBeDefined()
      expect(res.body.topMovies).toBeDefined()
      expect(res.body.occupancyByRoom).toBeDefined()
    })

    it('regular user should get 403', async () => {
      const { token } = await createUserWithToken()
      const res = await request(app)
        .get('/api/admin/reports/stats')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(403)
    })
  })
})
