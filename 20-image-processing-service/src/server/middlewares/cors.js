/**
 * @file middlewares/cors.js
 * @description CORS middleware configured with allowed origins from environment.
 */
import cors from 'cors'
import { ACCEPTED_ORIGINS } from '../config.js'

/**
 * Returns configured CORS middleware.
 * @param {{ acceptedOrigins?: string[] }} [options]
 */
export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) =>
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true)
      if (acceptedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
