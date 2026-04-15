// src/server/middlewares/cors.js
import cors from 'cors'

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGINS ?? 'http://localhost:3000'
  return raw.split(',').map((o) => o.trim()).filter(Boolean)
}

export const corsMiddleware = () =>
  cors({
    origin: (origin, callback) => {
      const allowed = getAllowedOrigins()
      if (!origin || allowed.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
