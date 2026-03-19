// src/models/weather.js
// Modelo de datos: lógica de negocio, caché Redis y persistencia con Prisma
// Separa completamente la lógica de acceso a datos del controlador

import { prisma } from '../lib/prisma.js'
import { cacheGet, cacheSet, cacheDel, cacheTTL } from '../lib/redis.js'
import { WeatherApiError } from '../middlewares/errorHandler.js'
import { VISUALCROSSING_BASE_URL, DEFAULTS } from '../config.js'

// ── Helpers internos ──────────────────────────────────────────────────────────

/**
 * Genera la clave de caché Redis.
 * Formato: weather:{location}:{date1}:{date2}
 * Normalizado a minúsculas para evitar duplicados por capitalización.
 */
function buildCacheKey(location, date1, date2) {
  const parts = ['weather', location.toLowerCase().replace(/\s+/g, '_')]
  if (date1) parts.push(date1)
  if (date2) parts.push(date2)
  return parts.join(':')
}

/**
 * Construye la URL completa de la Visual Crossing Timeline API.
 */
function buildApiUrl(location, date1, date2, { unitGroup, lang, include }) {
  const API_KEY = process.env.VISUALCROSSING_API_KEY
  if (!API_KEY) throw new Error('VISUALCROSSING_API_KEY no está definida en las variables de entorno')

  const segments = [VISUALCROSSING_BASE_URL, encodeURIComponent(location)]
  if (date1) segments.push(date1)
  if (date2) segments.push(date2)

  const params = new URLSearchParams({
    key: API_KEY,
    unitGroup: unitGroup ?? 'metric',
    lang: lang ?? 'es',
    include: include ?? 'days,hours,current',
  })

  return `${segments.join('/')}?${params.toString()}`
}

// ── WeatherModel ──────────────────────────────────────────────────────────────

export class WeatherModel {
  /**
   * Obtiene datos meteorológicos con caché Redis de 12 horas.
   * Flujo: Redis HIT → retorna cache | MISS → llama API → guarda en Redis + Prisma
   */
  static async getWeather({ location, date1, date2, unitGroup, lang, include }) {
    const cacheKey = buildCacheKey(location, date1, date2)

    // ── PASO 1: Buscar en caché Redis ─────────────────────────────────────────
    console.log(`[Cache] Buscando: "${cacheKey}"`)
    const cached = await cacheGet(cacheKey)

    if (cached !== null) {
      const ttlRemaining = await cacheTTL(cacheKey)
      console.log(`[Cache] ✅ HIT — TTL restante: ${ttlRemaining}s`)
      return { data: cached, fromCache: true, cacheKey, ttlRemaining }
    }

    // ── PASO 2: MISS → llamar a Visual Crossing API ───────────────────────────
    console.log(`[Cache] ❌ MISS — Llamando a Visual Crossing API...`)
    const url = buildApiUrl(location, date1, date2, { unitGroup, lang, include })
    console.log(`[API]   ${url.replace(process.env.VISUALCROSSING_API_KEY, '***')}`)

    const response = await fetch(url)

    if (!response.ok) {
      const body = await response.text()
      throw new WeatherApiError(
        `Visual Crossing respondió ${response.status}: ${body}`,
        response.status
      )
    }

    const weatherData = await response.json()

    // ── PASO 3: Guardar en Redis con TTL 12h ─────────────────────────────────
    const ttl = parseInt(process.env.CACHE_TTL_SECONDS ?? DEFAULTS.CACHE_TTL, 10)
    await cacheSet(cacheKey, weatherData, ttl)
    console.log(`[Cache] 💾 Guardado "${cacheKey}" — expira en ${ttl}s (${ttl / 3600}h)`)

    // ── PASO 4: Registrar consulta en Prisma (historial) ─────────────────────
    await prisma.weatherQuery.upsert({
      where: { cacheKey },
      update: { updatedAt: new Date(), queryCost: weatherData.queryCost ?? null },
      create: {
        location,
        date1: date1 ?? null,
        date2: date2 ?? null,
        unitGroup: unitGroup ?? 'metric',
        lang: lang ?? 'es',
        include: include ?? 'days,hours,current',
        cacheKey,
        queryCost: weatherData.queryCost ?? null,
      },
    })

    return { data: weatherData, fromCache: false, cacheKey, ttlRemaining: ttl }
  }

  /**
   * Retorna el historial de consultas paginado.
   */
  static async getHistory({ limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET }) {
    const [queries, total] = await prisma.$transaction([
      prisma.weatherQuery.findMany({
        orderBy: { updatedAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.weatherQuery.count(),
    ])

    return { data: queries, total, limit: Number(limit), offset: Number(offset) }
  }

  /**
   * Invalida el caché de una consulta y la elimina del historial.
   */
  static async invalidateCache({ location, date1, date2 }) {
    const cacheKey = buildCacheKey(location, date1, date2)
    const deleted = await cacheDel(cacheKey)

    await prisma.weatherQuery.deleteMany({ where: { cacheKey } })

    return { cacheKey, deleted }
  }
}

// ── FavoriteLocationModel ─────────────────────────────────────────────────────

export class FavoriteLocationModel {
  static async getAll() {
    return prisma.favoriteLocation.findMany({ orderBy: { createdAt: 'asc' } })
  }

  static async getById(id) {
    return prisma.favoriteLocation.findUnique({ where: { id } })
  }

  static async create({ name, location }) {
    // Si la ubicación ya existe la retornamos sin duplicar
    const existing = await prisma.favoriteLocation.findUnique({ where: { location } })
    if (existing) return existing

    return prisma.favoriteLocation.create({ data: { name, location } })
  }

  static async update({ id, name, location }) {
    return prisma.favoriteLocation.update({
      where: { id },
      data: { name, location },
    })
  }

  static async partialUpdate({ id, partialData }) {
    return prisma.favoriteLocation.update({
      where: { id },
      data: partialData,
    })
  }

  static async delete(id) {
    return prisma.favoriteLocation.delete({ where: { id } })
  }
}
