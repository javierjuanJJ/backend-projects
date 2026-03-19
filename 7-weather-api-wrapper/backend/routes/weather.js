// src/routes/weather.js
// Rutas del recurso /weather

import { Router } from 'express'
import { WeatherController } from '../controllers/weather.js'
import { validateWeatherQuery } from '../schemas/weather.js'

export const weatherRouter = Router()

// ── Middleware de validación de query params ───────────────────────────────────
function validateQuery(req, res, next) {
  const result = validateWeatherQuery(req.query)

  if (!result.success) {
    return res.status(400).json({
      error: 'Parámetros de consulta inválidos',
      details: result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // Reemplazamos req.query con los datos validados y con defaults aplicados
  req.query = result.data
  return next()
}

// ────────────────────────────────────────────────────────────────────────────
// GET  /weather?location=Madrid,ES[&date1=today][&date2=...][&unitGroup=metric]
// GET  /weather/history?limit=10&offset=0
// DELETE /weather/cache?location=Madrid,ES[&date1=...][&date2=...]
// ────────────────────────────────────────────────────────────────────────────
weatherRouter.get('/history', WeatherController.getHistory)
weatherRouter.get('/', validateQuery, WeatherController.getWeather)
weatherRouter.delete('/cache', WeatherController.invalidateCache)
