// lib/prisma.js
// Singleton de Prisma Client — evita múltiples instancias en desarrollo (hot-reload)

import { PrismaClient } from '@/app/generated/prisma/client'

const globalForPrisma = globalThis

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
