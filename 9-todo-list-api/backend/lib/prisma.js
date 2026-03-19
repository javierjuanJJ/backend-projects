// src/lib/prisma.js
// Singleton de PrismaClient — una sola instancia en toda la app

import { PrismaClient } from '../../app/generated/prisma/index.js'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
})

export default prisma
