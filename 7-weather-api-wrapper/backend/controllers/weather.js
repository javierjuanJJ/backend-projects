// src/controllers/weather.js
// Controlador: recibe req/res, delega la lógica al modelo

import { WeatherModel } from '../models/weather.js'
import { DEFAULTS } from '../config.js'

export class WeatherController {
  /**
   * GET /weather?location=Madrid,ES&date1=today&unitGroup=metric
   * Retorna datos del clima (del caché Redis o de la API externa).
   */
  static async getWeather(req, res, next) {
    try {
      // req.query ya viene validado y transformado por el middleware validateQuery
      const {
        location,
        date1,
        date2,
        unitGroup,
        lang,
        include,
      } = req.query

      const result = await WeatherModel.getWeather({ location, date1, date2, unitGroup, lang, include })

      return res.json({
        ...result.data,
        _meta: {
          fromCache: result.fromCache,
          cacheKey: result.cacheKey,
          ttlRemaining: result.ttlRemaining,
        },
      })
    } catch (err) {
      next(err)
    }
  }

  /**
   * GET /weather/history?limit=10&offset=0
   * Retorna el historial de consultas guardadas en Prisma.
   */
  static async getHistory(req, res, next) {
    try {
      const { limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = req.query
      const result = await WeatherModel.getHistory({ limit, offset })
      return res.json(result)
    } catch (err) {
      next(err)
    }
  }

  /**
   * DELETE /weather/cache?location=Madrid,ES&date1=today
   * Invalida el caché Redis y elimina el registro del historial.
   */
  static async invalidateCache(req, res, next) {
    try {
      const { location, date1, date2 } = req.query

      if (!location) {
        return res.status(400).json({ error: 'El parámetro "location" es obligatorio' })
      }

      const result = await WeatherModel.invalidateCache({ location, date1, date2 })

      return res.json({
        message: result.deleted
          ? `Caché eliminado correctamente`
          : `La clave no existía en caché`,
        cacheKey: result.cacheKey,
        deleted: result.deleted,
      })
    } catch (err) {
      next(err)
    }
  }
}
