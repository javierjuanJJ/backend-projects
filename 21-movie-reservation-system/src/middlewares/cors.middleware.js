// src/middlewares/cors.middleware.js

import cors from 'cors'
import { CORS_ORIGINS } from '../config.js'

/**
 * Configura CORS para los orígenes permitidos.
 * Los orígenes se leen de CORS_ALLOWED_ORIGINS (separados por coma).
 */
export const corsMiddleware = ({ acceptedOrigins = CORS_ORIGINS } = {}) => {
  return cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (Postman, curl, server-to-server)
      if (!origin) return callback(null, true)

      if (acceptedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS policy`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
}
