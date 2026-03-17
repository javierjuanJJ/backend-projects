// prisma/seed.js
const { PrismaClient } = require('../app/generated/prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Usuarios de prueba ──────────────────────────────────────
  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      password: await bcrypt.hash('alice1234', 12),
    },
  })
  console.log(`✅ Usuario: alice (id: ${alice.id})`)

  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      password: await bcrypt.hash('bob1234', 12),
    },
  })
  console.log(`✅ Usuario: bob (id: ${bob.id})`)

  // ── Posts de prueba ─────────────────────────────────────────
  const posts = [
    {
      title: 'Introducción a Next.js',
      content:
        'Next.js es un framework de React que permite renderizado del lado del servidor, generación estática y mucho más.',
      category: ['nextjs', 'react', 'frontend'],
      authorId: alice.id,
    },
    {
      title: 'Prisma ORM con PostgreSQL',
      content:
        'Prisma es un ORM moderno para Node.js que hace que trabajar con bases de datos sea más sencillo y seguro.',
      category: ['prisma', 'database', 'backend'],
      authorId: alice.id,
    },
    {
      title: 'Despliegue en Vercel',
      content:
        'Vercel es la plataforma perfecta para desplegar aplicaciones Next.js con CI/CD integrado y CDN global.',
      category: ['vercel', 'deployment', 'devops'],
      authorId: bob.id,
    },
  ]

  for (const post of posts) {
    const created = await prisma.post.create({ data: post })
    console.log(`✅ Post: "${created.title}" (id: ${created.id})`)
  }

  console.log('🎉 Seed completado!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

