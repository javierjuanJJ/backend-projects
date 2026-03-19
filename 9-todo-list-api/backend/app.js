// src/app.js
import 'dotenv/config'
import express from 'express'

import { DEFAULTS } from './config/index.js'
import { corsMiddleware, errorHandler } from './middlewares/index.js'
import { usersRouter } from './routes/users.js'
import { tasksRouter } from './routes/tasks.js'

const PORT = process.env.PORT ?? DEFAULTS.PORT
const app  = express()

// ── Middlewares globales ───────────────────────────────────
app.use(corsMiddleware())
app.use(express.json())

// ── Rutas ─────────────────────────────────────────────────
app.use('/users', usersRouter)
app.use('/tasks', tasksRouter)

// ── Ruta raíz informativa ──────────────────────────────────
app.get('/', (_, res) => {
  res.json({
    message: 'Express + Prisma ORM API',
    endpoints: {
      users: '/users',
      tasks: '/tasks',
      login: 'POST /users/login',
    },
  })
})

// ── 404 para rutas no definidas ────────────────────────────
app.use((_, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// ── Error handler global (siempre al final) ────────────────
app.use(errorHandler)

// ── Arrancar servidor solo si no estamos en test ──────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`)
  })
}

export default app
