/**
 * @file app.js
 * @description Express application factory. Mounts all middleware and routes.
 * Exported as default so it can be used by server.js and test suites.
 */
import express from 'express'
import { corsMiddleware } from './middlewares/cors.js'
import { authRouter } from './routes/auth.js'
import { imagesRouter } from './routes/images.js'
import { productsRouter } from './routes/products.js'
import { healthRouter } from './routes/health.js'
import { setupSwagger } from './docs/swagger.js'

const app = express()

// ── Global middleware ───────────────────────────────────────────────────────
app.use(corsMiddleware())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve static uploaded files
app.use('/uploads', express.static(process.env.UPLOAD_DIR ?? './uploads'))
app.use('/cache',   express.static(process.env.CACHE_DIR   ?? './cache'))

// ── OpenAPI documentation ───────────────────────────────────────────────────
setupSwagger(app)

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api',          healthRouter)
app.use('/api',          authRouter)
app.use('/api/images',   imagesRouter)
app.use('/api/products', productsRouter)

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res, _next) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)
  const status = err.status ?? 500
  res.status(status).json({
    error: err.message ?? 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
})

export default app
