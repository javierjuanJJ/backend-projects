import express from 'express'
import { shortenRouter } from './routes/shorten.js'
import { corsMiddleware } from './middleware/cors.js'

const PORT = process.env.PORT ?? 3001
const app = express()

// ── Middlewares globales ────────────────────────────────────────────────────
app.use(corsMiddleware())
app.use(express.json())

// ── Rutas ───────────────────────────────────────────────────────────────────
app.use('/shorten', shortenRouter)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Error handler global ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Global Error Handler]', err)

  if (err.message?.includes('no permitido por CORS')) {
    return res.status(403).json({ error: err.message })
  }

  res.status(500).json({ error: 'Internal server error' })
})

// ── Arrancar servidor (solo si no es entorno de test) ─────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor levantado en http://localhost:${PORT}`)
    console.log(`📋 Endpoints disponibles:`)
    console.log(`   POST   http://localhost:${PORT}/shorten`)
    console.log(`   GET    http://localhost:${PORT}/shorten/:shortCode`)
    console.log(`   PUT    http://localhost:${PORT}/shorten/:shortCode`)
    console.log(`   DELETE http://localhost:${PORT}/shorten/:shortCode`)
    console.log(`   GET    http://localhost:${PORT}/shorten/:shortCode/stats`)
  })
}

export default app
