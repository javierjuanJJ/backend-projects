// src/app.js
// Servidor Express — usado tanto por Next.js como por los tests

import express from 'express'
import { corsMiddleware } from './middlewares/cors.middleware.js'
import { errorHandler } from './middlewares/error.middleware.js'
import router from './routes/index.js'

const app = express()

// ── Middlewares globales ──────────────────────────────────
app.use(corsMiddleware())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Rutas ─────────────────────────────────────────────────
app.use('/api', router)

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Error handler global (debe ir al final) ───────────────
app.use(errorHandler)

export default app
