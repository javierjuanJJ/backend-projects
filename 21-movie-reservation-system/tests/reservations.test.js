// tests/reservations.test.js

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import {
  cleanDb, createGenre, createMovie, createRoom,
  createShowtime, createUserWithToken, createAdminWithToken,
} from './helpers.js'

describe('Reservations API', () => {
  let showtime, room

  beforeEach(async () => {
    await cleanDb()
    const genre = await createGenre('Drama')
    const movie = await createMovie(genre.id)
    room = await createRoom({ rows: ['A', 'B'], seatsPerRow: 5 })
    showtime = await createShowtime(movie.id, room.id)
  })

  // ── POST /api/reservations ───────────────────────────────
  describe('POST /api/reservations', () => {
    it('should create a reservation with valid seats', async () => {
      const { token } = await createUserWithToken()
      const seatIds = [room.seats[0].id, room.seats[1].id]

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ showtimeId: showtime.id, seatIds })

      expect(res.status).toBe(201)
      expect(res.body.reservation.status).toBe('confirmed')
      expect(res.body.reservation.seats).toHaveLength(2)
      expect(Number(res.body.reservation.totalPrice)).toBe(Number(showtime.price) * 2)
    })

    it('should prevent double booking — same seat, same showtime', async () => {
      const { token: token1 } = await createUserWithToken({ email: 'user1@test.com' })
      const { token: token2 } = await createUserWithToken({ email: 'user2@test.com' })
      const seatId = room.seats[0].id

      // Primera reserva OK
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ showtimeId: showtime.id, seatIds: [seatId] })

      // Segunda reserva del mismo asiento → 409
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token2}`)
        .send({ showtimeId: showtime.id, seatIds: [seatId] })

      expect(res.status).toBe(409)
      expect(res.body.error).toMatch(/already taken/i)
    })

    it('should allow booking after a cancellation frees the seat', async () => {
      const { token: token1, user: user1 } = await createUserWithToken({ email: 'can1@test.com' })
      const { token: token2 } = await createUserWithToken({ email: 'can2@test.com' })
      const seatId = room.seats[0].id

      // Reservar
      const r1 = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ showtimeId: showtime.id, seatIds: [seatId] })
      expect(r1.status).toBe(201)

      // Cancelar
      await request(app)
        .delete(`/api/reservations/${r1.body.reservation.id}`)
        .set('Authorization', `Bearer ${token1}`)

      // Reservar de nuevo → debe funcionar
      const r2 = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token2}`)
        .send({ showtimeId: showtime.id, seatIds: [seatId] })

      expect(r2.status).toBe(201)
    })

    it('should return 404 for non-existent showtime', async () => {
      const { token } = await createUserWithToken()

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ showtimeId: 'ghost-showtime', seatIds: [room.seats[0].id] })

      expect(res.status).toBe(404)
    })

    it('should return 400 with empty seatIds', async () => {
      const { token } = await createUserWithToken()

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ showtimeId: showtime.id, seatIds: [] })

      expect(res.status).toBe(400)
    })

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .send({ showtimeId: showtime.id, seatIds: [room.seats[0].id] })

      expect(res.status).toBe(401)
    })
  })

  // ── GET /api/reservations ────────────────────────────────
  describe('GET /api/reservations', () => {
    it('should return only the current user reservations', async () => {
      const { token: t1 } = await createUserWithToken({ email: 'r1@test.com' })
      const { token: t2 } = await createUserWithToken({ email: 'r2@test.com' })

      // User 1 reserva
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${t1}`)
        .send({ showtimeId: showtime.id, seatIds: [room.seats[0].id] })

      // User 2 consulta sus reservas (debe estar vacío)
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${t2}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
    })

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/reservations')
      expect(res.status).toBe(401)
    })
  })

  // ── DELETE /api/reservations/:id (cancel) ────────────────
  describe('DELETE /api/reservations/:id', () => {
    it('user should cancel their own upcoming reservation', async () => {
      const { token } = await createUserWithToken()
      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ showtimeId: showtime.id, seatIds: [room.seats[2].id] })

      const res = await request(app)
        .delete(`/api/reservations/${createRes.body.reservation.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.reservation.status).toBe('cancelled')
    })

    it('user should not cancel another user reservation', async () => {
      const { token: t1 } = await createUserWithToken({ email: 'owner@test.com' })
      const { token: t2 } = await createUserWithToken({ email: 'thief@test.com' })

      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${t1}`)
        .send({ showtimeId: showtime.id, seatIds: [room.seats[3].id] })

      const res = await request(app)
        .delete(`/api/reservations/${createRes.body.reservation.id}`)
        .set('Authorization', `Bearer ${t2}`)

      expect(res.status).toBe(403)
    })

    it('admin should be able to cancel any reservation', async () => {
      const { token: userToken } = await createUserWithToken({ email: 'victim@test.com' })
      const { token: adminToken } = await createAdminWithToken()

      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ showtimeId: showtime.id, seatIds: [room.seats[4].id] })

      const res = await request(app)
        .delete(`/api/reservations/${createRes.body.reservation.id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
    })

    it('should not cancel an already cancelled reservation', async () => {
      const { token } = await createUserWithToken()
      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ showtimeId: showtime.id, seatIds: [room.seats[0].id] })

      // Cancelar primera vez
      await request(app)
        .delete(`/api/reservations/${createRes.body.reservation.id}`)
        .set('Authorization', `Bearer ${token}`)

      // Cancelar segunda vez → 409
      const res = await request(app)
        .delete(`/api/reservations/${createRes.body.reservation.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(409)
    })
  })
})
