// src/lib/prisma.js
// Singleton de PrismaClient — evita múltiples instancias en desarrollo (hot reload)
// Patrón recomendado por la documentación oficial de Prisma para Next.js / Node.js:
// https://www.prisma.io/docs/guides/frameworks/nextjs#26-set-up-prisma-client
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
