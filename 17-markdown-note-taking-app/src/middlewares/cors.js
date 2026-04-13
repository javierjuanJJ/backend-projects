// src/middlewares/cors.js
import cors from 'cors'
import { ACCEPTED_ORIGINS } from '../config/index.js'

/**
 * Middleware CORS configurable.
 * Por defecto usa los orígenes definidos en ACCEPTED_ORIGINS (config + .env).
 * Se puede sobreescribir pasando una lista personalizada.
 */
export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => {
  return cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (curl, Postman, herramientas internas)
      if (!origin) return callback(null, true)

      if (acceptedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(
        Object.assign(new Error(`Origen no permitido por la política CORS: ${origin}`), { status: 403 })
      )
    },
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
}
