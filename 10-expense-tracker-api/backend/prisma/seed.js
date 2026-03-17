const { PrismaClient } = require("../app/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
require("dotenv/config");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpiar datos previos
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuarios de ejemplo con contraseñas cifradas
  const hashedPassword1 = await bcrypt.hash("password123", 10);
  const hashedPassword2 = await bcrypt.hash("securepass456", 10);

  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      password: hashedPassword1,
      expenses: {
        create: [
          {
            title: "Supermercado",
            description: "Compras semanales de comida",
            amount: 150.5,
          },
          {
            title: "Netflix",
            description: "Suscripción mensual streaming",
            amount: 15.99,
          },
          {
            title: "Gasolina",
            description: "Recarga de combustible",
            amount: 60.0,
          },
        ],
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      password: hashedPassword2,
      expenses: {
        create: [
          {
            title: "Gimnasio",
            description: "Membresía mensual",
            amount: 45.0,
          },
          {
            title: "Restaurante",
            description: "Cena con amigos",
            amount: 80.25,
          },
        ],
      },
    },
  });

  console.log("✅ Seed completado:");
  console.log(`   - Usuario: ${alice.email}`);
  console.log(`   - Usuario: ${bob.email}`);
  console.log("   - Expenses creados: 5 en total");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
