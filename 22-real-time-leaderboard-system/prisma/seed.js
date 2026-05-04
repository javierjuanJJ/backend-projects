// prisma/seed.js
// Run with: pnpm prisma db seed
// Configure in package.json: "prisma": { "seed": "node prisma/seed.js" }

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Clean existing data (dev only) ─────────────────────────────────────
  await prisma.score.deleteMany()
  await prisma.game.deleteMany()
  await prisma.user.deleteMany()
  console.log('  ✓ Cleared existing data')

  // ─── Users ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Test1234!', 10)

  const [alice, bob, carol] = await Promise.all([
    prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        username: 'alice',
        email: 'alice@example.com',
        password_hash: passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        username: 'bob',
        email: 'bob@example.com',
        password_hash: passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        username: 'carol',
        email: 'carol@example.com',
        password_hash: passwordHash,
      },
    }),
  ])
  console.log('  ✓ Created 3 users (password: Test1234!)')

  // ─── Games ──────────────────────────────────────────────────────────────
  const [tetris, snake, pacman] = await Promise.all([
    prisma.game.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Tetris Classic',
        description: 'Stack falling blocks to clear lines.',
      },
    }),
    prisma.game.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Snake',
        description: 'Grow your snake without hitting the walls.',
      },
    }),
    prisma.game.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Pac-Man',
        description: 'Eat dots, avoid ghosts.',
      },
    }),
  ])
  console.log('  ✓ Created 3 games')

  // ─── Scores ─────────────────────────────────────────────────────────────
  const now = new Date()
  const daysAgo = (n) => new Date(now - n * 864e5)

  const scores = [
    // Tetris scores
    { user: alice, game: tetris, value: 42000, daysAgo: 1 },
    { user: bob,   game: tetris, value: 38500, daysAgo: 2 },
    { user: carol, game: tetris, value: 51000, daysAgo: 3 },
    { user: alice, game: tetris, value: 29000, daysAgo: 10 }, // older
    // Snake scores
    { user: bob,   game: snake,  value: 980,   daysAgo: 1 },
    { user: carol, game: snake,  value: 750,   daysAgo: 2 },
    { user: alice, game: snake,  value: 1100,  daysAgo: 5 },
    // Pac-Man scores
    { user: carol, game: pacman, value: 88000, daysAgo: 1 },
    { user: alice, game: pacman, value: 72000, daysAgo: 3 },
    { user: bob,   game: pacman, value: 95000, daysAgo: 8 },
  ]

  await prisma.score.createMany({
    data: scores.map(({ user, game, value, daysAgo: d }) => ({
      id: crypto.randomUUID(),
      user_id: user.id,
      game_id: game.id,
      score_value: value,
      achieved_at: daysAgo(d),
    })),
  })
  console.log(`  ✓ Created ${scores.length} scores`)

  console.log('\n✅ Seed complete!')
  console.log('   Test credentials: alice@example.com / Test1234!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
