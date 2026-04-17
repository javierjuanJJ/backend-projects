// tests/helpers.js
// Factories y utilidades reutilizables entre suites de tests

import bcrypt from 'bcrypt'
import request from 'supertest'
import { prisma } from '../src/lib/prisma.js'
import app from '../src/app.js'

// ── Limpieza de BD en orden correcto (respeta FK) ─────────
export async function cleanDb() {
  await prisma.reservationSeat.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.showtime.deleteMany()
  await prisma.seat.deleteMany()
  await prisma.room.deleteMany()
  await prisma.movie.deleteMany()
  await prisma.genre.deleteMany()
  await prisma.user.deleteMany()
}

// ── Factories ─────────────────────────────────────────────
export async function createUser({ role = 'user', username, email, password = 'Test1234!' } = {}) {
  const hashed = await bcrypt.hash(password, 10)
  return prisma.user.create({
    data: {
      username: username || `user_${Date.now()}`,
      email: email || `user_${Date.now()}@test.com`,
      password: hashed,
      role,
    },
  })
}

export async function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', username: 'admin_test', email: 'admin@test.com', ...overrides })
}

export async function createGenre(name = 'Test Genre') {
  return prisma.genre.create({ data: { name } })
}

export async function createRoom({ name = 'Sala Test', rows = ['A', 'B'], seatsPerRow = 5 } = {}) {
  const seats = []
  for (const row of rows) {
    for (let n = 1; n <= seatsPerRow; n++) {
      seats.push({ rowLabel: row, seatNumber: n })
    }
  }
  return prisma.room.create({
    data: {
      name,
      totalCapacity: seats.length,
      seats: { create: seats },
    },
    include: { seats: true },
  })
}

export async function createMovie(genreId, overrides = {}) {
  return prisma.movie.create({
    data: {
      title: 'Test Movie',
      description: 'A test movie',
      durationMinutes: 120,
      genreId,
      ...overrides,
    },
  })
}

export async function createShowtime(movieId, roomId, overrides = {}) {
  return prisma.showtime.create({
    data: {
      movieId,
      roomId,
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // +48h
      price: 10.00,
      ...overrides,
    },
  })
}

// ── Auth helpers ──────────────────────────────────────────
export async function loginAs(credentials) {
  const res = await request(app)
    .post('/api/auth/login')
    .send(credentials)
  return res.body.accessToken
}

export async function getAdminToken() {
  const admin = await createAdmin()
  return loginAs({ email: admin.email, password: 'Test1234!' })
}

export async function getUserToken() {
  const user = await createUser()
  return loginAs({ email: user.email, password: 'Test1234!' })
}

// Retorna el usuario Y su token en un solo paso
export async function createUserWithToken(overrides = {}) {
  const user = await createUser(overrides)
  const token = await loginAs({ email: user.email, password: overrides.password || 'Test1234!' })
  return { user, token }
}

export async function createAdminWithToken() {
  const user = await createAdmin()
  const token = await loginAs({ email: user.email, password: 'Test1234!' })
  return { user, token }
}
