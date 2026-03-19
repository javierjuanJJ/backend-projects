import cors from 'cors'

// Orígenes por defecto — se pueden sobreescribir al llamar corsMiddleware()
// o con la variable de entorno CORS_ORIGINS (csv)
const DEFAULT_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:1234',
      'http://localhost:4000',
    ]

/**
 * Fábrica de middleware CORS.
 * Uso: app.use(corsMiddleware())
 *      app.use(corsMiddleware({ acceptedOrigins: ['https://miweb.com'] }))
 *
 * @param {{ acceptedOrigins?: string[] }} options
 */
export const corsMiddleware = ({ acceptedOrigins = DEFAULT_ORIGINS } = {}) => {
  return cors({
    origin: (origin, callback) => {
      // Sin origin → Postman, curl, SSR — siempre permitido
      if (!origin) return callback(null, true)

      if (acceptedOrigins.includes(origin)) return callback(null, true)

      return callback(new Error(`CORS: Origen no permitido → ${origin}`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400,
  })
}
