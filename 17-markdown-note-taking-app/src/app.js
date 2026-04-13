// src/app.js
import 'dotenv/config'
import express from 'express'
import { notesRouter }    from './routes/notes.js'
import { corsMiddleware } from './middlewares/cors.js'
import { DEFAULTS }       from './config/index.js'

const PORT = process.env.PORT ?? DEFAULTS.PORT
const app  = express()

// ─── Middlewares globales ─────────────────────────────────────────────────
app.use(corsMiddleware())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Rutas ────────────────────────────────────────────────────────────────
app.use('/notes', notesRouter)

// Health check
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
)

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ error: 'Ruta no encontrada' })
)

// ─── Error handler global ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error global]', err)
  res
    .status(err.status ?? 500)
    .json({ error: err.message ?? 'Error interno del servidor' })
})

// ─── Arrancar servidor ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🚀  Servidor arrancado en http://localhost:${PORT}\n`)
    console.log('📋  Endpoints disponibles:')
    console.log('     GET    /health')
    console.log('     GET    /notes')
    console.log('     POST   /notes              (JSON o multipart con campo "file")')
    console.log('     POST   /notes/check        (comprobar gramática sin guardar)')
    console.log('     GET    /notes/:id')
    console.log('     PUT    /notes/:id')
    console.log('     PATCH  /notes/:id')
    console.log('     DELETE /notes/:id')
    console.log('     GET    /notes/:id/render   (HTML renderizado)')
    console.log('     POST   /notes/:id/check    (comprobar gramática de nota guardada)')
    console.log('')
  })
}

export default app
