// src/app.js
// Punto de entrada de la aplicación Express

import express from 'express'
import { readFileSync } from 'fs'

// Carga .env sin dependencias externas (Node ≥ 18)
loadEnv('.env')

import { corsMiddleware } from './middlewares/cors.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { weatherRouter } from './routes/weather.js'
import { favoritesRouter } from './routes/favorites.js'
import { DEFAULTS } from './config.js'

// ── Carga .env manual (sin dotenv) ────────────────────────────────────────────
function loadEnv(path) {
  try {
    const lines = readFileSync(path, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [key, ...rest] = trimmed.split('=')
      const value = rest.join('=').trim()
      if (key && value && !process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // .env opcional
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? DEFAULTS.PORT
const app = express()

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(corsMiddleware())
app.use(express.json())

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/weather',   weatherRouter)
app.use('/favorites', favoritesRouter)

// Ruta raíz con info de los endpoints disponibles
app.get('/', (req, res) => {
  res.json({
    name: 'Weather API',
    version: '1.0.0',
    endpoints: {
      weather: {
        'GET /weather':         'Clima por ubicación (con caché Redis 12h)',
        'GET /weather/history': 'Historial de consultas (Prisma)',
        'DELETE /weather/cache':'Invalida caché de una consulta',
      },
      favorites: {
        'GET /favorites':        'Listar ubicaciones favoritas',
        'GET /favorites/:id':    'Obtener favorita por ID',
        'POST /favorites':       'Crear favorita',
        'PUT /favorites/:id':    'Reemplazar favorita',
        'PATCH /favorites/:id':  'Actualizar favorita parcialmente',
        'DELETE /favorites/:id': 'Eliminar favorita',
      },
    },
    examples: {
      forecast:   '/weather?location=Madrid,ES',
      today:      '/weather?location=London,UK&date1=today&include=current,days',
      dateRange:  '/weather?location=Paris,FR&date1=2025-03-01&date2=2025-03-07',
      latLon:     '/weather?location=-34.6037,-58.3816&date1=today',
      units:      '/weather?location=New York,US&unitGroup=us&lang=en',
    },
  })
})

// ── Manejador global de errores (siempre al final) ────────────────────────────
app.use(errorHandler)

// ── Arranque del servidor ─────────────────────────────────────────────────────
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`)
    console.log(`📖 Endpoints disponibles en http://localhost:${PORT}/\n`)
  })
}

export default app
