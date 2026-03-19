import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  await prisma.expense.deleteMany()
  await prisma.user.deleteMany()

  const pass1 = await bcrypt.hash('password123', 12)
  const pass2 = await bcrypt.hash('securepass456', 12)

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: pass1,
      expenses: {
        create: [
          { title: 'Supermercado', description: 'Compras semanales de comida', amount: 150.50 },
          { title: 'Netflix',      description: 'Suscripción mensual streaming', amount: 15.99 },
          { title: 'Gasolina',     description: 'Recarga de combustible',        amount: 60.00 },
        ],
      },
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: pass2,
      expenses: {
        create: [
          { title: 'Gimnasio',    description: 'Membresía mensual',  amount: 45.00 },
          { title: 'Restaurante', description: 'Cena con amigos',    amount: 80.25 },
        ],
      },
    },
  })

  console.log('✅ Seed completado:')
  console.log(`   → ${alice.email}  (pass: password123)`)
  console.log(`   → ${bob.email}    (pass: securepass456)`)
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
