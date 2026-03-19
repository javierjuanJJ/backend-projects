// prisma/seed.js
import { PrismaClient } from '../app/generated/prisma/index.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const prisma = new PrismaClient()
const SECRET = process.env.JWT_SECRET || 'fallback_secret'

async function main() {
  console.log('🌱 Iniciando seed...\n')
  await prisma.task.deleteMany()
  await prisma.user.deleteMany()

  const usersInput = [
    { name: 'Ana García',      email: 'ana@example.com'    },
    { name: 'Carlos López',    email: 'carlos@example.com' },
    { name: 'María Rodríguez', email: 'maria@example.com'  },
  ]

  const created = []
  for (const u of usersInput) {
    const password = await bcrypt.hash('password123', 12)
    const user     = await prisma.user.create({ data: { ...u, password } })
    const token    = jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '7d' })
    await prisma.user.update({ where: { id: user.id }, data: { token } })
    created.push(user)
    console.log(`✅ ${user.name} — ${user.email}`)
  }

  const tasks = [
    { title: 'Diseñar mockups',          description: 'Wireframes en Figma para la nueva app móvil.',             userId: created[0].id },
    { title: 'Revisar documentación',    description: 'Leer y actualizar README con ejemplos de la API REST.',     userId: created[0].id },
    { title: 'Configurar CI/CD',         description: 'GitHub Actions para tests y deploy automático a main.',     userId: created[1].id },
    { title: 'Optimizar queries',        description: 'EXPLAIN ANALYZE en queries lentas y añadir índices.',       userId: created[1].id },
    { title: 'Implementar JWT',          description: 'Middleware de autenticación con JWT en endpoints privados.', userId: created[1].id },
    { title: 'Escribir tests unitarios', description: 'Cubrir 80% del código con Jest y Testing Library.',         userId: created[2].id },
    { title: 'Refactorizar componentes', description: 'Convertir clases a funcionales y extraer custom hooks.',    userId: created[2].id },
  ]

  for (const t of tasks) {
    const task = await prisma.task.create({ data: t })
    console.log(`📋 "${task.title}"`)
  }

  console.log('\n🎉 Seed completado. Password de prueba: password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
