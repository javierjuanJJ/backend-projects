// src/middlewares/error.middleware.js
// Handler global de errores de Express (debe ser el último middleware)

/**
 * Centraliza el manejo de errores.
 * Formato de respuesta consistente: { error, details?, stack? }
 */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  // Errores de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this value already exists.',
      details: err.meta?.target,
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  // Errores de validación Zod (si se lanzan como error)
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation error', details: err.errors })
  }

  // Errores de negocio conocidos
  if (err.message === 'SEAT_ALREADY_TAKEN') {
    return res.status(409).json({ error: 'One or more seats are already taken for this showtime.' })
  }

  if (err.message === 'SHOWTIME_NOT_FOUND') {
    return res.status(404).json({ error: 'Showtime not found.' })
  }

  // CORS
  if (err.message?.includes('not allowed by CORS')) {
    return res.status(403).json({ error: err.message })
  }

  // Error genérico
  const statusCode = err.statusCode || err.status || 500
  return res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
