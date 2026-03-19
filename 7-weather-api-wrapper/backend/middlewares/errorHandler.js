// src/middlewares/errorHandler.js
// Middleware global de manejo de errores (debe ir al final de app.use)

export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.name}: ${err.message}`)

  // Error de CORS
  if (err.message?.includes('no permitido por CORS')) {
    return res.status(403).json({ error: err.message })
  }

  // Error de Prisma: registro no encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' })
  }

  // Error de Prisma: violación de unicidad
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos', field: err.meta?.target })
  }

  // Error de Visual Crossing API
  if (err.name === 'WeatherApiError') {
    return res.status(err.statusCode ?? 502).json({ error: err.message })
  }

  // Error genérico
  const status = err.status ?? err.statusCode ?? 500
  return res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  })
}

// Error personalizado para la Weather API
export class WeatherApiError extends Error {
  constructor(message, statusCode = 502) {
    super(message)
    this.name = 'WeatherApiError'
    this.statusCode = statusCode
  }
}
