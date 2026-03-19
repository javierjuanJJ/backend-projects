// src/middlewares/index.js
// CORS, autenticación JWT, validación Zod y manejo global de errores

import cors from 'cors'
import { ACCEPTED_ORIGINS } from '../config/index.js'
import { verifyToken, extractToken } from '../lib/auth.js'

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) =>
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (Postman, curl, server-to-server)
      if (!origin || acceptedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`Origen no permitido por CORS: ${origin}`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

// ─────────────────────────────────────────────
// AUTH MIDDLEWARE — protege rutas con JWT
// ─────────────────────────────────────────────
export const requireAuth = (req, res, next) => {
  const token = extractToken(req)

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  req.user = decoded // { id, email, name, iat, exp }
  next()
}

// ─────────────────────────────────────────────
// VALIDATION FACTORIES (igual que el patrón de referencia)
// ─────────────────────────────────────────────

/**
 * Crea un middleware de validación completa con un schema Zod
 * @param {Function} validateFn - función safeParse del schema
 */
export const validate = (validateFn) => (req, res, next) => {
  const result = validateFn(req.body)
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }
  req.body = result.data // datos limpios y validados
  next()
}

/**
 * Igual que validate pero para actualizaciones parciales (PATCH)
 * @param {Function} validatePartialFn - función safeParse del schema parcial
 */
export const validatePartial = (validatePartialFn) => (req, res, next) => {
  const result = validatePartialFn(req.body)
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }
  req.body = result.data
  next()
}

// ─────────────────────────────────────────────
// ERROR HANDLER GLOBAL (último middleware en app.js)
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  // Error de Prisma: registro no encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Recurso no encontrado' })
  }

  // Error de Prisma: campo único duplicado
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] ?? 'campo'
    return res.status(409).json({ error: `El ${field} ya está en uso` })
  }

  // Error de CORS
  if (err.message?.startsWith('Origen no permitido')) {
    return res.status(403).json({ error: err.message })
  }

  // Error genérico
  return res.status(err.status ?? 500).json({
    error: err.message ?? 'Error interno del servidor',
  })
}
