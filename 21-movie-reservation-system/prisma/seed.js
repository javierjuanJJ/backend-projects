// prisma/seed.js
// Seed inicial: admin, géneros, salas, asientos y películas de ejemplo

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Géneros ──────────────────────────────────────────────
  const genres = await Promise.all([
    prisma.genre.upsert({ where: { name: 'Acción' },      update: {}, create: { name: 'Acción' } }),
    prisma.genre.upsert({ where: { name: 'Drama' },       update: {}, create: { name: 'Drama' } }),
    prisma.genre.upsert({ where: { name: 'Comedia' },     update: {}, create: { name: 'Comedia' } }),
    prisma.genre.upsert({ where: { name: 'Terror' },      update: {}, create: { name: 'Terror' } }),
    prisma.genre.upsert({ where: { name: 'Ciencia Ficción' }, update: {}, create: { name: 'Ciencia Ficción' } }),
    prisma.genre.upsert({ where: { name: 'Animación' },   update: {}, create: { name: 'Animación' } }),
    prisma.genre.upsert({ where: { name: 'Thriller' },    update: {}, create: { name: 'Thriller' } }),
  ])
  console.log(`✅ ${genres.length} géneros creados`)

  // ── Admin ─────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cinema.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    },
  })
  console.log(`✅ Admin creado: ${admin.email}`)

  // ── Salas + Asientos ──────────────────────────────────────
  const buildSeats = (rows, seatsPerRow) => {
    const seats = []
    for (const row of rows) {
      for (let n = 1; n <= seatsPerRow; n++) {
        seats.push({ rowLabel: row, seatNumber: n })
      }
    }
    return seats
  }

  const sala1 = await prisma.room.upsert({
    where: { id: 'room-sala-1' },
    update: {},
    create: {
      id: 'room-sala-1',
      name: 'Sala 1 — Estándar',
      totalCapacity: 80,
      seats: { create: buildSeats(['A','B','C','D','E','F','G','H'], 10) },
    },
  })

  const sala2 = await prisma.room.upsert({
    where: { id: 'room-sala-2' },
    update: {},
    create: {
      id: 'room-sala-2',
      name: 'Sala 2 — VIP',
      totalCapacity: 30,
      seats: { create: buildSeats(['A','B','C'], 10) },
    },
  })
  console.log(`✅ Salas creadas: ${sala1.name}, ${sala2.name}`)

  // ── Películas ─────────────────────────────────────────────
  const [accion, scifi, drama, animacion] = genres
  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        title: 'Guardianes del Mañana',
        description: 'Un equipo de héroes debe salvar el futuro de la humanidad.',
        posterUrl: 'https://picsum.photos/seed/movie1/300/450',
        durationMinutes: 132,
        genreId: accion.id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Éxodo Estelar',
        description: 'La última nave de la humanidad busca un nuevo hogar en el universo.',
        posterUrl: 'https://picsum.photos/seed/movie2/300/450',
        durationMinutes: 148,
        genreId: scifi.id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'La Última Sinfonía',
        description: 'Un músico ciego redescubre el amor a través de su arte.',
        posterUrl: 'https://picsum.photos/seed/movie3/300/450',
        durationMinutes: 114,
        genreId: drama.id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Mundo Fantástico',
        description: 'Un joven explorador descubre un mundo mágico bajo su ciudad.',
        posterUrl: 'https://picsum.photos/seed/movie4/300/450',
        durationMinutes: 96,
        genreId: animacion.id,
      },
    }),
  ])
  console.log(`✅ ${movies.length} películas creadas`)

  // ── Funciones (próximos 7 días) ───────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const showtimeData = []

  for (let day = 0; day < 7; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() + day)

    // Mañana: película 1 en sala 1
    showtimeData.push({
      movieId: movies[0].id,
      roomId: sala1.id,
      startTime: new Date(new Date(date).setHours(11, 0, 0, 0)),
      price: 8.5,
    })
    // Tarde: película 2 en sala 1
    showtimeData.push({
      movieId: movies[1].id,
      roomId: sala1.id,
      startTime: new Date(new Date(date).setHours(16, 30, 0, 0)),
      price: 9.0,
    })
    // Noche: película 3 en sala 2 (VIP)
    showtimeData.push({
      movieId: movies[2].id,
      roomId: sala2.id,
      startTime: new Date(new Date(date).setHours(21, 0, 0, 0)),
      price: 15.0,
    })
  }

  await prisma.showtime.createMany({ data: showtimeData, skipDuplicates: true })
  console.log(`✅ ${showtimeData.length} funciones creadas`)

  console.log('\n🎬 Seed completado exitosamente!')
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
