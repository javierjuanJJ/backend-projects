// lib/prisma.js
// Singleton de Prisma Client para Next.js
// Evita múltiples instancias en desarrollo con hot-reload
// Documentación: https://www.prisma.io/docs/guides/frameworks/nextjs#26-set-up-prisma-client

import { PrismaClient } from '../app/generated/prisma/index.js'

const globalForPrisma = global

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
