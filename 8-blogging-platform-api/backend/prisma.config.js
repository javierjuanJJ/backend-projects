// prisma.config.js
require('dotenv').config()

/** @type {import('prisma/config').PrismaConfig} */
const config = {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
}

module.exports = config
