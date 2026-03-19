// src/middlewares/cors.js
// Middleware CORS configurable con lista de orígenes aceptados

import cors from 'cors'
import { ACCEPTED_ORIGINS } from '../config.js'

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => {
  return cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (Postman, curl, apps móviles)
      if (!origin) return callback(null, true)

      if (acceptedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error(`Origen no permitido por CORS: ${origin}`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
}
