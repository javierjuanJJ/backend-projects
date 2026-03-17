// prisma/seed.js
// Poblar la base de datos con datos de ejemplo
// Ejecutar: node prisma/seed.js  o  npm run prisma:seed

import { PrismaClient } from '../app/generated/prisma/index.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production'

async function main() {
  console.log('🌱 Iniciando seed...\n')

  // Limpiar datos existentes
  await prisma.task.deleteMany()
  await prisma.user.deleteMany()
  console.log('🧹 Base de datos limpiada')

  // ── Crear usuarios ──
  const users = [
    {
      name:  'Ana García',
      email: 'ana@example.com',
      password: await bcrypt.hash('password123', 12),
    },
    {
      name:  'Carlos López',
      email: 'carlos@example.com',
      password: await bcrypt.hash('password123', 12),
    },
    {
      name:  'María Rodríguez',
      email: 'maria@example.com',
      password: await bcrypt.hash('password123', 12),
    },
  ]

  const createdUsers = []
  for (const userData of users) {
    const user = await prisma.user.create({ data: userData })

    // Generar y guardar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    await prisma.user.update({ where: { id: user.id }, data: { token } })
    createdUsers.push({ ...user, token })

    console.log(`✅ Usuario creado: ${user.name} (${user.email})`)
  }

  // ── Crear tasks ──
  const tasksData = [
    // Tasks de Ana
    {
      title:       'Diseñar mockups de la app',
      description: 'Crear wireframes y mockups para la nueva aplicación móvil usando Figma. Incluir pantallas de login, home y perfil.',
      userId: createdUsers[0].id,
    },
    {
      title:       'Revisar documentación de API',
      description: 'Leer y documentar todos los endpoints de la API REST. Actualizar el README con ejemplos de uso.',
      userId: createdUsers[0].id,
    },
    // Tasks de Carlos
    {
      title:       'Configurar pipeline CI/CD',
      description: 'Configurar GitHub Actions para tests automáticos y deploy a producción en cada push a main.',
      userId: createdUsers[1].id,
    },
    {
      title:       'Optimizar queries de base de datos',
      description: 'Analizar las queries lentas con EXPLAIN ANALYZE y añadir índices donde sea necesario.',
      userId: createdUsers[1].id,
    },
    {
      title:       'Implementar autenticación JWT',
      description: 'Agregar middleware de autenticación con JWT en todos los endpoints protegidos del backend.',
      userId: createdUsers[1].id,
    },
    // Tasks de María
    {
      title:       'Escribir tests unitarios',
      description: 'Cubrir al menos el 80% del código con tests unitarios usando Jest y Testing Library.',
      userId: createdUsers[2].id,
    },
    {
      title:       'Refactorizar componentes React',
      description: 'Convertir componentes de clase a funcionales con hooks. Extraer lógica repetida a custom hooks.',
      userId: createdUsers[2].id,
    },
  ]

  for (const taskData of tasksData) {
    const task = await prisma.task.create({ data: taskData })
    console.log(`📋 Task creada: "${task.title}"`)
  }

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📝 Credenciales de prueba (password: password123):')
  for (const u of createdUsers) {
    console.log(`   - ${u.email}`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
