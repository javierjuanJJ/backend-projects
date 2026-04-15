// src/server/middlewares/error.middleware.js

/**
 * Middleware centralizado de manejo de errores.
 * Debe registrarse DESPUÉS de todas las rutas en Express.
 */
// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  // Error de CORS
  if (err.message?.includes('not allowed by CORS')) {
    return res.status(403).json({ error: err.message })
  }

  // Error de validación de JSON mal formado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  return res.status(500).json({ error: 'Internal server error' })
}
