// src/lib/prisma.js
// Singleton del cliente Prisma — evita múltiples instancias en desarrollo
// Docs: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
